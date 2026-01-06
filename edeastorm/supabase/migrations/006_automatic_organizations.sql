-- Migration: 006_automatic_organizations.sql
-- Description: Automatically creates a personal organization for every new profile

CREATE OR REPLACE FUNCTION public.handle_new_profile_organization()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Only create a new organization if the user isn't already assigned to one 
    -- (e.g., they weren't invited to an existing team)
    IF NEW.organization_id IS NULL THEN
        
        -- Generate a unique slug based on their name or email
        base_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '-', 'g'));
        final_slug := base_slug;
        
        -- Ensure slug is unique
        WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
            counter := counter + 1;
            final_slug := base_slug || '-' || counter;
        END LOOP;

        -- Create the organization
        INSERT INTO public.organizations (name, slug)
        VALUES ('MyOrganization', final_slug)
        RETURNING id INTO new_org_id;

        -- Link the profile to the new organization
        NEW.organization_id := new_org_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run BEFORE a profile is created
DROP TRIGGER IF EXISTS on_profile_created_org ON public.profiles;
CREATE TRIGGER on_profile_created_org
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_organization();
