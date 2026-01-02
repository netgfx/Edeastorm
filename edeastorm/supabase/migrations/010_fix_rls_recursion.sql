-- Fix infinite recursion in organization_members RLS policy

-- 1. Create a security definer function to get current user's org IDs
-- This function bypasses RLS to avoid infinite recursion when used in policies
CREATE OR REPLACE FUNCTION public.get_auth_user_organization_ids()
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN ARRAY(
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid()
    );
END;
$$;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;

-- 3. Create new non-recursive policies

-- Policy for viewing own memberships (simple and fast)
CREATE POLICY "Users can view their own memberships"
    ON public.organization_members FOR SELECT
    USING (user_id = auth.uid());

-- Policy for viewing other members in same orgs (uses the function to break recursion)
CREATE POLICY "Users can view members of their organizations"
    ON public.organization_members FOR SELECT
    USING (
        organization_id = ANY(public.get_auth_user_organization_ids())
    );

-- Also update the invitation policy to use the function for better performance/safety
DROP POLICY IF EXISTS "Users can view invitations of their organizations" ON public.organization_invitations;

CREATE POLICY "Users can view invitations of their organizations"
    ON public.organization_invitations FOR SELECT
    USING (
        organization_id = ANY(public.get_auth_user_organization_ids())
    );
