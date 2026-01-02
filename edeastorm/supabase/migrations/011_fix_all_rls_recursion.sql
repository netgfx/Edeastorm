-- Migration: 011_fix_all_rls_recursion.sql
-- Description: Fixes infinite recursion in ALL policies by using security definer functions

-- 1. Create helper functions
CREATE OR REPLACE FUNCTION public.get_my_org_ids()
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT COALESCE(array_agg(organization_id), '{}')
    FROM public.organization_members
    WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_admin_org_ids()
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT COALESCE(array_agg(organization_id), '{}')
    FROM public.organization_members
    WHERE user_id = auth.uid() AND role = 'admin';
$$;

-- 2. Fix organization_members policies

-- Drop potentially problematic policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.organization_members;

-- Re-create policies
CREATE POLICY "Users can view their own memberships"
    ON public.organization_members FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view members of their organizations"
    ON public.organization_members FOR SELECT
    USING (
        organization_id = ANY(public.get_my_org_ids())
    );

CREATE POLICY "Admins can manage members"
    ON public.organization_members FOR ALL
    USING (
        organization_id = ANY(public.get_my_admin_org_ids())
    );

-- 3. Fix organization_invitations policies

-- Drop potentially problematic policies
DROP POLICY IF EXISTS "Users can view invitations of their organizations" ON public.organization_invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.organization_invitations;

-- Re-create policies
CREATE POLICY "Users can view invitations of their organizations"
    ON public.organization_invitations FOR SELECT
    USING (
        organization_id = ANY(public.get_my_org_ids())
    );

CREATE POLICY "Admins can manage invitations"
    ON public.organization_invitations FOR ALL
    USING (
        organization_id = ANY(public.get_my_admin_org_ids())
    );
