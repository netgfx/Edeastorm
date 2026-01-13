-- Migration: 015_fix_invitation_race_condition.sql
-- Description: Fixes race condition where new users get their own org instead of joining invited org
-- Issue: When invited users sign up, the profile trigger creates a personal org before invitation is processed

-- Drop the old trigger function and recreate with invitation check
DROP FUNCTION IF EXISTS public.handle_new_profile_organization() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_profile_organization()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    base_slug TEXT;
    final_slug TEXT;
    counter INT := 0;
    pending_invitation RECORD;
BEGIN
    -- Only create a new organization if the user isn't already assigned to one
    IF NEW.organization_id IS NULL THEN
        -- Check if there's a pending invitation for this email
        SELECT * INTO pending_invitation
        FROM public.organization_invitations
        WHERE email = NEW.email
        AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1;

        -- If there's a pending invitation, assign to that org and add as member
        IF pending_invitation.id IS NOT NULL THEN
            NEW.organization_id := pending_invitation.organization_id;
            NEW.role := pending_invitation.role;

            -- Add user as member to the invited organization
            INSERT INTO public.organization_members (organization_id, user_id, role)
            VALUES (pending_invitation.organization_id, NEW.id, pending_invitation.role)
            ON CONFLICT (organization_id, user_id) DO NOTHING;

            -- Log profile creation with invitation context
            INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata)
            VALUES (
                NEW.id,
                'user.profile_created',
                'user',
                NEW.id,
                jsonb_build_object(
                    'email', NEW.email,
                    'organization_id', pending_invitation.organization_id,
                    'role', pending_invitation.role,
                    'via_invitation', true
                )
            );

            -- Don't delete the invitation yet - let the accept endpoint handle it
            -- This allows the accept flow to complete properly

            RETURN NEW;
        END IF;

        -- No pending invitation - create personal organization
        -- Generate a slug from email or name
        base_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
        IF base_slug = '' THEN base_slug := 'user'; END IF;

        final_slug := base_slug;

        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
            counter := counter + 1;
            final_slug := base_slug || counter::text;
        END LOOP;

        -- Create the organization
        INSERT INTO public.organizations (name, slug)
        VALUES ('My Workspace', final_slug)
        RETURNING id INTO new_org_id;

        -- Link the profile to the new organization
        NEW.organization_id := new_org_id;

        -- Add user as admin member
        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (new_org_id, NEW.id, 'admin');

        -- Log profile creation with new org
        INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata)
        VALUES (
            NEW.id,
            'user.profile_created',
            'user',
            NEW.id,
            jsonb_build_object(
                'email', NEW.email,
                'organization_id', new_org_id,
                'role', 'admin',
                'via_invitation', false
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_profile_created_create_org ON public.profiles;
CREATE TRIGGER on_profile_created_create_org
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_profile_organization();
