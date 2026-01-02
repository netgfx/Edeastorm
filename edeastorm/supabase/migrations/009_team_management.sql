-- Migration: 009_team_management.sql
-- Description: Adds team management capabilities (members, invitations, roles)

-- Create role enum
CREATE TYPE public.org_member_role AS ENUM ('admin', 'editor', 'viewer');

-- Create organization_members table
CREATE TABLE public.organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role public.org_member_role DEFAULT 'viewer'::public.org_member_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- Create organization_invitations table
CREATE TABLE public.organization_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role public.org_member_role DEFAULT 'viewer'::public.org_member_role NOT NULL,
    token TEXT NOT NULL UNIQUE,
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '7 days') NOT NULL,
    UNIQUE(organization_id, email)
);

-- Enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for organization_members

-- Users can view members of organizations they belong to
CREATE POLICY "Users can view members of their organizations"
    ON public.organization_members FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

-- Admins can insert/update/delete members in their organizations
CREATE POLICY "Admins can manage members"
    ON public.organization_members FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policies for organization_invitations

-- Users can view invitations of organizations they belong to
CREATE POLICY "Users can view invitations of their organizations"
    ON public.organization_invitations FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

-- Admins can manage invitations
CREATE POLICY "Admins can manage invitations"
    ON public.organization_invitations FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Backfill existing users as admins of their organizations
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT organization_id, id, 'admin'::public.org_member_role
FROM public.profiles
WHERE organization_id IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Update the handle_new_profile_organization function to also add the user as admin member
CREATE OR REPLACE FUNCTION public.handle_new_profile_organization()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    base_slug TEXT;
    final_slug TEXT;
    counter INT := 0;
BEGIN
    -- Only create a new organization if the user isn't already assigned to one 
    -- (though typically new profiles won't have one yet)
    IF NEW.organization_id IS NULL THEN
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
