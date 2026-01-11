-- Edeastorm Database Functions & Utilities
-- Migration: 002_create_functions.sql
-- Description: Creates helper functions for the application

--------------------------------------------
-- 1. GENERATE SHORT ID FUNCTION
--------------------------------------------
-- Generates a random short ID for board URLs
CREATE OR REPLACE FUNCTION generate_short_id(length INTEGER DEFAULT 10)
RETURNS VARCHAR AS $$
DECLARE
    chars VARCHAR := 'abcdefghijklmnopqrstuvwxyz0123456789';
    result VARCHAR := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------
-- 2. CREATE BOARD WITH SHORT ID
--------------------------------------------
-- Automatically generates short_id when creating a board
CREATE OR REPLACE FUNCTION create_board_with_short_id()
RETURNS TRIGGER AS $$
DECLARE
    new_short_id VARCHAR;
    attempts INTEGER := 0;
BEGIN
    LOOP
        new_short_id := generate_short_id(10);
        -- Check if short_id already exists
        IF NOT EXISTS (SELECT 1 FROM public.boards WHERE short_id = new_short_id) THEN
            NEW.short_id := new_short_id;
            EXIT;
        END IF;
        attempts := attempts + 1;
        -- Prevent infinite loop
        IF attempts > 100 THEN
            RAISE EXCEPTION 'Could not generate unique short_id after 100 attempts';
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS generate_board_short_id ON public.boards;
CREATE TRIGGER generate_board_short_id
    BEFORE INSERT ON public.boards
    FOR EACH ROW
    WHEN (NEW.short_id IS NULL)
    EXECUTE FUNCTION create_board_with_short_id();

--------------------------------------------
-- 3. CREATE PROFILE ON USER SIGNUP
--------------------------------------------
-- Automatically creates a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_email VARCHAR;
    user_name VARCHAR;
    user_avatar VARCHAR;
    domain VARCHAR;
    org_id UUID;
BEGIN
    user_email := NEW.email;
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(user_email, '@', 1));
    user_avatar := NEW.raw_user_meta_data->>'avatar_url';
    
    -- Extract domain from email
    domain := split_part(user_email, '@', 2);
    
    -- Check if there's an organization with this domain in allowed_domains
    SELECT id INTO org_id 
    FROM public.organizations 
    WHERE domain = ANY(allowed_domains)
    LIMIT 1;
    
    -- Create the profile
    INSERT INTO public.profiles (id, email, full_name, avatar_url, organization_id, role)
    VALUES (
        NEW.id,
        user_email,
        user_name,
        user_avatar,
        org_id,
        CASE 
            WHEN org_id IS NULL THEN 'contributor'
            ELSE 'contributor'
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

--------------------------------------------
-- 4. GET BOARD BY SHORT ID
--------------------------------------------
CREATE OR REPLACE FUNCTION get_board_by_short_id(p_short_id VARCHAR)
RETURNS TABLE (
    id UUID,
    short_id VARCHAR,
    team_id UUID,
    organization_id UUID,
    title VARCHAR,
    problem_statement TEXT,
    description TEXT,
    thumbnail_url TEXT,
    is_public BOOLEAN,
    is_archived BOOLEAN,
    settings JSONB,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.short_id,
        b.team_id,
        b.organization_id,
        b.title,
        b.problem_statement,
        b.description,
        b.thumbnail_url,
        b.is_public,
        b.is_archived,
        b.settings,
        b.created_by,
        b.created_at,
        b.updated_at
    FROM public.boards b
    WHERE b.short_id = p_short_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------
-- 5. CHECK USER BOARD ACCESS
--------------------------------------------
CREATE OR REPLACE FUNCTION check_board_access(p_board_id UUID, p_user_id UUID)
RETURNS TABLE (
    has_access BOOLEAN,
    access_role VARCHAR
) AS $$
DECLARE
    board_record RECORD;
    collab_role VARCHAR;
    user_org_id UUID;
BEGIN
    -- Get board info
    SELECT b.*, p.organization_id as owner_org_id INTO board_record
    FROM public.boards b
    LEFT JOIN public.profiles p ON p.id = b.created_by
    WHERE b.id = p_board_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::VARCHAR;
        RETURN;
    END IF;
    
    -- Check if board is public
    IF board_record.is_public THEN
        RETURN QUERY SELECT TRUE, 'viewer'::VARCHAR;
        RETURN;
    END IF;
    
    -- Check if user is the creator
    IF board_record.created_by = p_user_id THEN
        RETURN QUERY SELECT TRUE, 'admin'::VARCHAR;
        RETURN;
    END IF;
    
    -- Check board collaborators
    SELECT bc.role INTO collab_role
    FROM public.board_collaborators bc
    WHERE bc.board_id = p_board_id AND bc.user_id = p_user_id;
    
    IF FOUND THEN
        RETURN QUERY SELECT TRUE, collab_role;
        RETURN;
    END IF;
    
    -- Check organization membership
    SELECT organization_id INTO user_org_id
    FROM public.profiles
    WHERE id = p_user_id;
    
    IF user_org_id IS NOT NULL AND user_org_id = board_record.organization_id THEN
        RETURN QUERY SELECT TRUE, 'contributor'::VARCHAR;
        RETURN;
    END IF;
    
    -- Check team membership
    IF board_record.team_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = board_record.team_id AND tm.user_id = p_user_id
        ) THEN
            RETURN QUERY SELECT TRUE, 'contributor'::VARCHAR;
            RETURN;
        END IF;
    END IF;
    
    -- No access
    RETURN QUERY SELECT FALSE, NULL::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------
-- 6. CLEANUP INACTIVE ROOM USERS
--------------------------------------------
-- Removes users who haven't been seen for 5 minutes
CREATE OR REPLACE FUNCTION cleanup_inactive_room_users()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.room_users
    WHERE last_seen < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------
-- 7. LOG ACTIVITY
--------------------------------------------
CREATE OR REPLACE FUNCTION log_activity(
    p_board_id UUID,
    p_user_id UUID,
    p_action VARCHAR,
    p_entity_type VARCHAR DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.activity_log (board_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (p_board_id, p_user_id, p_action, p_entity_type, p_entity_id, p_metadata)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------
-- 8. CREATE BOARD SNAPSHOT
--------------------------------------------
CREATE OR REPLACE FUNCTION create_board_snapshot(
    p_board_id UUID,
    p_name VARCHAR,
    p_description TEXT,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    snapshot_id UUID;
    items_data JSONB;
BEGIN
    -- Get all canvas items for the board
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'item_type', item_type,
            'x', x,
            'y', y,
            'z_index', z_index,
            'metadata', metadata,
            'created_by', created_by
        )
    ) INTO items_data
    FROM public.canvas_items
    WHERE board_id = p_board_id;
    
    -- Create the snapshot
    INSERT INTO public.board_snapshots (board_id, name, description, snapshot_data, created_by)
    VALUES (p_board_id, p_name, COALESCE(p_description, ''), COALESCE(items_data, '[]'::jsonb), p_user_id)
    RETURNING id INTO snapshot_id;
    
    -- Log the activity
    PERFORM log_activity(p_board_id, p_user_id, 'snapshot_created', 'snapshot', snapshot_id, 
        jsonb_build_object('name', p_name));
    
    RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------
-- 9. RESTORE BOARD FROM SNAPSHOT
--------------------------------------------
CREATE OR REPLACE FUNCTION restore_board_from_snapshot(
    p_snapshot_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    snap_record RECORD;
    item JSONB;
BEGIN
    -- Get the snapshot
    SELECT * INTO snap_record
    FROM public.board_snapshots
    WHERE id = p_snapshot_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Snapshot not found';
    END IF;
    
    -- Delete current canvas items
    DELETE FROM public.canvas_items WHERE board_id = snap_record.board_id;
    
    -- Restore items from snapshot
    FOR item IN SELECT * FROM jsonb_array_elements(snap_record.snapshot_data)
    LOOP
        INSERT INTO public.canvas_items (
            board_id, item_type, x, y, z_index, metadata, created_by
        ) VALUES (
            snap_record.board_id,
            item->>'item_type',
            (item->>'x')::numeric,
            (item->>'y')::numeric,
            (item->>'z_index')::integer,
            item->'metadata',
            (item->>'created_by')::uuid
        );
    END LOOP;
    
    -- Log the activity
    PERFORM log_activity(snap_record.board_id, p_user_id, 'snapshot_restored', 'snapshot', p_snapshot_id,
        jsonb_build_object('name', snap_record.name));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
