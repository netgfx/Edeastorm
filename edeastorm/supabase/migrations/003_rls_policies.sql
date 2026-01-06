-- IdeaFlow Row Level Security Policies
-- Migration: 003_rls_policies.sql
-- Description: Creates RLS policies for all tables

--------------------------------------------
-- ENABLE RLS ON ALL TABLES
--------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

--------------------------------------------
-- ORGANIZATIONS POLICIES
--------------------------------------------
-- Anyone can view organizations
CREATE POLICY "Organizations are viewable by everyone"
ON public.organizations FOR SELECT
USING (true);

-- Only super_admins can insert organizations
CREATE POLICY "Super admins can insert organizations"
ON public.organizations FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- Only super_admins and org admins can update their organization
CREATE POLICY "Admins can update their organization"
ON public.organizations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND (
            role = 'super_admin' 
            OR (role = 'admin' AND organization_id = organizations.id)
        )
    )
);

--------------------------------------------
-- PROFILES POLICIES
--------------------------------------------
-- Users can view any profile
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own profile (handled by trigger, but just in case)
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

--------------------------------------------
-- TEAMS POLICIES
--------------------------------------------
-- View teams in your organization or teams you're a member of
CREATE POLICY "Users can view teams in their org or member of"
ON public.teams FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = teams.id AND user_id = auth.uid()
    )
);

-- Org admins and editors can create teams
CREATE POLICY "Editors can create teams in their org"
ON public.teams FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND organization_id = teams.organization_id
        AND role IN ('admin', 'editor')
    )
);

-- Team owners can update their team
CREATE POLICY "Team owners can update teams"
ON public.teams FOR UPDATE
TO authenticated
USING (
    created_by = auth.uid()
    OR 
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = teams.id AND user_id = auth.uid() AND role = 'owner'
    )
);

-- Team owners can delete their team
CREATE POLICY "Team owners can delete teams"
ON public.teams FOR DELETE
TO authenticated
USING (
    created_by = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND organization_id = teams.organization_id
        AND role = 'admin'
    )
);

--------------------------------------------
-- TEAM_MEMBERS POLICIES
--------------------------------------------
-- View team members of your teams
CREATE POLICY "View team members"
ON public.team_members FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
    )
);

-- Team moderators and owners can add members
CREATE POLICY "Team mods can add members"
ON public.team_members FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_members.team_id 
        AND tm.user_id = auth.uid() 
        AND tm.role IN ('moderator', 'owner')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_members.team_id AND t.created_by = auth.uid()
    )
);

-- Team owners can update member roles
CREATE POLICY "Team owners can update members"
ON public.team_members FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_members.team_id 
        AND tm.user_id = auth.uid() 
        AND tm.role = 'owner'
    )
);

-- Team owners can remove members
CREATE POLICY "Team owners can remove members"
ON public.team_members FOR DELETE
TO authenticated
USING (
    user_id = auth.uid() -- Can remove themselves
    OR
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_members.team_id 
        AND tm.user_id = auth.uid() 
        AND tm.role = 'owner'
    )
);

--------------------------------------------
-- BOARDS POLICIES
--------------------------------------------
-- View boards: public boards, boards you created, or have access to
CREATE POLICY "View accessible boards"
ON public.boards FOR SELECT
TO authenticated
USING (
    is_public = true
    OR created_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.board_collaborators
        WHERE board_id = boards.id AND user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.team_members tm
        JOIN public.teams t ON t.id = tm.team_id
        WHERE t.id = boards.team_id AND tm.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND organization_id = boards.organization_id
    )
);

-- Authenticated users can create boards
CREATE POLICY "Authenticated users can create boards"
ON public.boards FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Board creators and admins can update
CREATE POLICY "Board admins can update boards"
ON public.boards FOR UPDATE
TO authenticated
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.board_collaborators
        WHERE board_id = boards.id AND user_id = auth.uid() AND role IN ('admin', 'editor')
    )
);

-- Board creators can delete
CREATE POLICY "Board creators can delete boards"
ON public.boards FOR DELETE
TO authenticated
USING (created_by = auth.uid());

--------------------------------------------
-- BOARD_COLLABORATORS POLICIES
--------------------------------------------
-- View collaborators of boards you have access to
CREATE POLICY "View board collaborators"
ON public.board_collaborators FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.boards b
        WHERE b.id = board_collaborators.board_id
        AND (
            b.created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.board_collaborators bc
                WHERE bc.board_id = b.id AND bc.user_id = auth.uid()
            )
        )
    )
);

-- Board admins can add collaborators
CREATE POLICY "Board admins can add collaborators"
ON public.board_collaborators FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.boards b
        WHERE b.id = board_collaborators.board_id
        AND (
            b.created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.board_collaborators bc
                WHERE bc.board_id = b.id AND bc.user_id = auth.uid() AND bc.role = 'admin'
            )
        )
    )
);

-- Board admins can update collaborator roles
CREATE POLICY "Board admins can update collaborators"
ON public.board_collaborators FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.boards b
        WHERE b.id = board_collaborators.board_id
        AND b.created_by = auth.uid()
    )
);

-- Board admins can remove collaborators, users can remove themselves
CREATE POLICY "Remove collaborators"
ON public.board_collaborators FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.boards b
        WHERE b.id = board_collaborators.board_id AND b.created_by = auth.uid()
    )
);

--------------------------------------------
-- CANVAS_ITEMS POLICIES
--------------------------------------------
-- View items on boards you have access to
CREATE POLICY "View canvas items"
ON public.canvas_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM (SELECT * FROM check_board_access(board_id, auth.uid())) AS access
        WHERE access.has_access = true
    )
);

-- Contributors and above can create items
CREATE POLICY "Contributors can create items"
ON public.canvas_items FOR INSERT
TO authenticated
WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM (SELECT * FROM check_board_access(board_id, auth.uid())) AS access
        WHERE access.has_access = true 
        AND access.access_role IN ('contributor', 'editor', 'admin')
    )
);

-- Item creators and board editors can update
CREATE POLICY "Update canvas items"
ON public.canvas_items FOR UPDATE
TO authenticated
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM (SELECT * FROM check_board_access(board_id, auth.uid())) AS access
        WHERE access.has_access = true AND access.access_role IN ('editor', 'admin')
    )
);

-- Item creators and board editors can delete
CREATE POLICY "Delete canvas items"
ON public.canvas_items FOR DELETE
TO authenticated
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM (SELECT * FROM check_board_access(board_id, auth.uid())) AS access
        WHERE access.has_access = true AND access.access_role IN ('editor', 'admin')
    )
);

--------------------------------------------
-- ROOM_USERS POLICIES
--------------------------------------------
-- View room users on boards you have access to
CREATE POLICY "View room users"
ON public.room_users FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM (SELECT * FROM check_board_access(board_id, auth.uid())) AS access
        WHERE access.has_access = true
    )
);

-- Users with access can join rooms
CREATE POLICY "Join room"
ON public.room_users FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM (SELECT * FROM check_board_access(board_id, auth.uid())) AS access
        WHERE access.has_access = true
    )
);

-- Users can update their own presence
CREATE POLICY "Update own room presence"
ON public.room_users FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can leave (delete their presence)
CREATE POLICY "Leave room"
ON public.room_users FOR DELETE
TO authenticated
USING (user_id = auth.uid());

--------------------------------------------
-- BOARD_SNAPSHOTS POLICIES
--------------------------------------------
-- View snapshots of boards you have access to
CREATE POLICY "View board snapshots"
ON public.board_snapshots FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM (SELECT * FROM check_board_access(board_id, auth.uid())) AS access
        WHERE access.has_access = true
    )
);

-- Editors and admins can create snapshots
CREATE POLICY "Create snapshots"
ON public.board_snapshots FOR INSERT
TO authenticated
WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM (SELECT * FROM check_board_access(board_id, auth.uid())) AS access
        WHERE access.has_access = true AND access.access_role IN ('editor', 'admin')
    )
);

-- Snapshot creators can delete their snapshots
CREATE POLICY "Delete own snapshots"
ON public.board_snapshots FOR DELETE
TO authenticated
USING (created_by = auth.uid());

--------------------------------------------
-- ACTIVITY_LOG POLICIES
--------------------------------------------
-- View activity on boards you have access to
CREATE POLICY "View activity log"
ON public.activity_log FOR SELECT
TO authenticated
USING (
    board_id IS NULL -- System-wide logs for admins
    OR EXISTS (
        SELECT 1 FROM (SELECT * FROM check_board_access(board_id, auth.uid())) AS access
        WHERE access.has_access = true
    )
);

-- System can insert activity logs (via functions)
CREATE POLICY "Insert activity log"
ON public.activity_log FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
