-- IdeaFlow Database Schema
-- Migration: 001_create_tables.sql
-- Description: Creates the core tables for the collaborative ideation app

-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------
-- 1. ORGANIZATIONS TABLE
--------------------------------------------
-- Organizations represent companies or teams using the platform
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[], -- Email domains allowed to join
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by slug
CREATE INDEX idx_organizations_slug ON public.organizations(slug);

--------------------------------------------
-- 2. PROFILES TABLE
--------------------------------------------
-- Extended user profiles linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'contributor' CHECK (role IN ('viewer', 'contributor', 'editor', 'admin', 'super_admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_organization ON public.profiles(organization_id);

--------------------------------------------
-- 3. TEAMS TABLE
--------------------------------------------
-- Teams within an organization
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for organization lookup
CREATE INDEX idx_teams_organization ON public.teams(organization_id);

--------------------------------------------
-- 4. TEAM_MEMBERS TABLE
--------------------------------------------
-- Junction table for team membership
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'owner')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Create indexes
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);

--------------------------------------------
-- 5. BOARDS TABLE
--------------------------------------------
-- Collaborative canvas boards
CREATE TABLE IF NOT EXISTS public.boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    short_id VARCHAR(10) UNIQUE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    problem_statement TEXT, -- The ideation challenge/question
    description TEXT,
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{
        "canvasWidth": 10000,
        "canvasHeight": 10000,
        "defaultNoteColor": "#FFED23",
        "allowAnonymous": false,
        "moderationEnabled": false
    }'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_boards_short_id ON public.boards(short_id);
CREATE INDEX idx_boards_team ON public.boards(team_id);
CREATE INDEX idx_boards_organization ON public.boards(organization_id);
CREATE INDEX idx_boards_created_by ON public.boards(created_by);

--------------------------------------------
-- 6. BOARD_COLLABORATORS TABLE
--------------------------------------------
-- Who has access to a specific board
CREATE TABLE IF NOT EXISTS public.board_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'contributor' CHECK (role IN ('viewer', 'contributor', 'editor', 'admin')),
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(board_id, user_id)
);

-- Create indexes
CREATE INDEX idx_board_collaborators_board ON public.board_collaborators(board_id);
CREATE INDEX idx_board_collaborators_user ON public.board_collaborators(user_id);

--------------------------------------------
-- 7. CANVAS_ITEMS TABLE
--------------------------------------------
-- All items on the canvas (sticky notes, images, headers, etc.)
CREATE TABLE IF NOT EXISTS public.canvas_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('sticky_note', 'image', 'header', 'shape', 'connector')),
    x NUMERIC NOT NULL DEFAULT 0,
    y NUMERIC NOT NULL DEFAULT 0,
    z_index INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Metadata structure for sticky_note:
    -- {
    --   "title": "Note content",
    --   "description": "",
    --   "color": "#FFED23",
    --   "textSize": 14,
    --   "size": { "width": 100, "height": 100 }
    -- }
    -- Metadata structure for image:
    -- {
    --   "url": "https://...",
    --   "alt": "Description",
    --   "size": { "width": 200, "height": 150 }
    -- }
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_canvas_items_board ON public.canvas_items(board_id);
CREATE INDEX idx_canvas_items_type ON public.canvas_items(item_type);
CREATE INDEX idx_canvas_items_created_by ON public.canvas_items(created_by);

--------------------------------------------
-- 8. ROOM_USERS TABLE
--------------------------------------------
-- Active users in a board room (for presence tracking)
CREATE TABLE IF NOT EXISTS public.room_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    cursor_x NUMERIC DEFAULT 0,
    cursor_y NUMERIC DEFAULT 0,
    color VARCHAR(7) DEFAULT '#7F23FF',
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(board_id, user_id)
);

-- Create indexes
CREATE INDEX idx_room_users_board ON public.room_users(board_id);
CREATE INDEX idx_room_users_user ON public.room_users(user_id);
CREATE INDEX idx_room_users_last_seen ON public.room_users(last_seen);

--------------------------------------------
-- 9. BOARD_SNAPSHOTS TABLE
--------------------------------------------
-- Saved states of boards for versioning
CREATE TABLE IF NOT EXISTS public.board_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    snapshot_data JSONB NOT NULL, -- Contains all canvas_items at save time
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_board_snapshots_board ON public.board_snapshots(board_id);

--------------------------------------------
-- 10. ACTIVITY_LOG TABLE
--------------------------------------------
-- Audit log for tracking changes
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_activity_log_board ON public.activity_log(board_id);
CREATE INDEX idx_activity_log_user ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at);

--------------------------------------------
-- UPDATED_AT TRIGGER FUNCTION
--------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['organizations', 'profiles', 'teams', 'boards', 'canvas_items']
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
            CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t);
    END LOOP;
END $$;
