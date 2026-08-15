-- Migration 014: Tighten RLS Policies
-- Description: Restricts organization visibility and adds missing RLS policies
-- Run manually on Supabase

--------------------------------------------
-- FIX: RESTRICT ORGANIZATION VISIBILITY
--------------------------------------------
-- Currently organizations are viewable by everyone (line 23-25 in 003_rls_policies.sql)
-- This is a security issue - should only be visible to members

DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;

CREATE POLICY "Organizations viewable by members"
ON public.organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  OR id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

--------------------------------------------
-- ADD: AI_INSIGHTS RLS POLICIES
--------------------------------------------
-- Enable RLS if not already enabled
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- View AI insights on boards you have access to
DROP POLICY IF EXISTS "View AI insights on accessible boards" ON public.ai_insights;
CREATE POLICY "View AI insights on accessible boards"
ON public.ai_insights FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM check_board_access(board_id, auth.uid())
    WHERE has_access = true
  )
);

-- Only editors/admins can create AI insights
DROP POLICY IF EXISTS "Create AI insights" ON public.ai_insights;
CREATE POLICY "Create AI insights"
ON public.ai_insights FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM check_board_access(board_id, auth.uid())
    WHERE has_access = true AND access_role IN ('editor', 'admin')
  )
);

-- Creators and board admins can update insights
DROP POLICY IF EXISTS "Update AI insights" ON public.ai_insights;
CREATE POLICY "Update AI insights"
ON public.ai_insights FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM check_board_access(board_id, auth.uid())
    WHERE has_access = true AND access_role = 'admin'
  )
);

-- Creators and board admins can delete insights
DROP POLICY IF EXISTS "Delete AI insights" ON public.ai_insights;
CREATE POLICY "Delete AI insights"
ON public.ai_insights FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM check_board_access(board_id, auth.uid())
    WHERE has_access = true AND access_role = 'admin'
  )
);

--------------------------------------------
-- ADD: AI_PROCESSING_LOGS RLS POLICIES
--------------------------------------------
ALTER TABLE public.ai_processing_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own processing logs
DROP POLICY IF EXISTS "View own AI processing logs" ON public.ai_processing_logs;
CREATE POLICY "View own AI processing logs"
ON public.ai_processing_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- System can insert logs (via service role or user actions)
DROP POLICY IF EXISTS "Insert AI processing logs" ON public.ai_processing_logs;
CREATE POLICY "Insert AI processing logs"
ON public.ai_processing_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

--------------------------------------------
-- ADD: AI_FEEDBACK RLS POLICIES
--------------------------------------------
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view feedback on insights they have access to
DROP POLICY IF EXISTS "View AI feedback" ON public.ai_feedback;
CREATE POLICY "View AI feedback"
ON public.ai_feedback FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_insights
    WHERE id = ai_feedback.insight_id
    AND EXISTS (
      SELECT 1 FROM check_board_access(board_id, auth.uid())
      WHERE has_access = true
    )
  )
);

-- Users can create feedback on insights they have access to
DROP POLICY IF EXISTS "Create AI feedback" ON public.ai_feedback;
CREATE POLICY "Create AI feedback"
ON public.ai_feedback FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.ai_insights
    WHERE id = ai_feedback.insight_id
    AND EXISTS (
      SELECT 1 FROM check_board_access(board_id, auth.uid())
      WHERE has_access = true
    )
  )
);

-- Users can update their own feedback
DROP POLICY IF EXISTS "Update own AI feedback" ON public.ai_feedback;
CREATE POLICY "Update own AI feedback"
ON public.ai_feedback FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own feedback
DROP POLICY IF EXISTS "Delete own AI feedback" ON public.ai_feedback;
CREATE POLICY "Delete own AI feedback"
ON public.ai_feedback FOR DELETE
TO authenticated
USING (user_id = auth.uid());

--------------------------------------------
-- ADD: ORGANIZATION_INVITATIONS RLS POLICIES
--------------------------------------------
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Organization admins can view invitations for their org
DROP POLICY IF EXISTS "View organization invitations" ON public.organization_invitations;
CREATE POLICY "View organization invitations"
ON public.organization_invitations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND organization_id = organization_invitations.organization_id
    AND role IN ('admin', 'super_admin')
  )
  OR invited_by = auth.uid()
);

-- Organization admins can create invitations
DROP POLICY IF EXISTS "Create organization invitations" ON public.organization_invitations;
CREATE POLICY "Create organization invitations"
ON public.organization_invitations FOR INSERT
TO authenticated
WITH CHECK (
  invited_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND organization_id = organization_invitations.organization_id
    AND role IN ('admin', 'super_admin')
  )
);

-- Organization admins can delete invitations (revoke)
DROP POLICY IF EXISTS "Delete organization invitations" ON public.organization_invitations;
CREATE POLICY "Delete organization invitations"
ON public.organization_invitations FOR DELETE
TO authenticated
USING (
  invited_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND organization_id = organization_invitations.organization_id
    AND role IN ('admin', 'super_admin')
  )
);

--------------------------------------------
-- ADD: ORGANIZATION_MEMBERS RLS POLICIES
--------------------------------------------
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of their organization
DROP POLICY IF EXISTS "View organization members" ON public.organization_members;
CREATE POLICY "View organization members"
ON public.organization_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND organization_id = organization_members.organization_id
  )
  OR user_id = auth.uid()
);

-- Organization admins can add members
DROP POLICY IF EXISTS "Add organization members" ON public.organization_members;
CREATE POLICY "Add organization members"
ON public.organization_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND organization_id = organization_members.organization_id
    AND role IN ('admin', 'super_admin')
  )
);

-- Organization admins can update member roles
DROP POLICY IF EXISTS "Update organization members" ON public.organization_members;
CREATE POLICY "Update organization members"
ON public.organization_members FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND organization_id = organization_members.organization_id
    AND role IN ('admin', 'super_admin')
  )
);

-- Organization admins can remove members, or users can remove themselves
DROP POLICY IF EXISTS "Remove organization members" ON public.organization_members;
CREATE POLICY "Remove organization members"
ON public.organization_members FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND organization_id = organization_members.organization_id
    AND role IN ('admin', 'super_admin')
  )
);

--------------------------------------------
-- VERIFICATION QUERIES
--------------------------------------------
-- Run these after applying the migration to verify policies are in place

-- Check organization policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'organizations'
-- ORDER BY policyname;

-- Check ai_insights policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename = 'ai_insights'
-- ORDER BY policyname;

-- Check that RLS is enabled on all tables
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN (
--   'ai_insights',
--   'ai_processing_logs',
--   'ai_feedback',
--   'organization_invitations',
--   'organization_members'
-- );
