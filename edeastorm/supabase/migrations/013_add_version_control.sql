-- Add version control to canvas_items for optimistic locking
-- Migration: 013_add_version_control.sql
-- Description: Adds version column and triggers for conflict detection

--------------------------------------------
-- ADD VERSION COLUMN
--------------------------------------------
ALTER TABLE public.canvas_items 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- Create index for faster version lookups
CREATE INDEX IF NOT EXISTS idx_canvas_items_version ON public.canvas_items(id, version);

--------------------------------------------
-- VERSION INCREMENT FUNCTION
--------------------------------------------
CREATE OR REPLACE FUNCTION increment_canvas_item_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment version on every update
    NEW.version = OLD.version + 1;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------
-- VERSION INCREMENT TRIGGER
--------------------------------------------
DROP TRIGGER IF EXISTS canvas_items_version_trigger ON public.canvas_items;
CREATE TRIGGER canvas_items_version_trigger
    BEFORE UPDATE ON public.canvas_items
    FOR EACH ROW
    EXECUTE FUNCTION increment_canvas_item_version();

--------------------------------------------
-- OPTIMISTIC LOCK CHECK FUNCTION
--------------------------------------------
-- This function can be called from the application to perform
-- optimistic locking updates with version checking
CREATE OR REPLACE FUNCTION update_canvas_item_with_version(
    p_id UUID,
    p_expected_version INTEGER,
    p_updates JSONB
)
RETURNS TABLE (
    success BOOLEAN,
    current_version INTEGER,
    item JSONB
) AS $$
DECLARE
    v_current_version INTEGER;
    v_item JSONB;
BEGIN
    -- Get current version
    SELECT version INTO v_current_version
    FROM public.canvas_items
    WHERE id = p_id
    FOR UPDATE; -- Lock the row
    
    -- Check if item exists
    IF v_current_version IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::JSONB;
        RETURN;
    END IF;
    
    -- Check version match
    IF v_current_version != p_expected_version THEN
        -- Version conflict - return current item
        SELECT row_to_json(ci.*) INTO v_item
        FROM public.canvas_items ci
        WHERE ci.id = p_id;
        
        RETURN QUERY SELECT FALSE, v_current_version, v_item;
        RETURN;
    END IF;
    
    -- Version matches, perform update
    -- The trigger will increment version automatically
    UPDATE public.canvas_items
    SET
        x = COALESCE((p_updates->>'x')::NUMERIC, x),
        y = COALESCE((p_updates->>'y')::NUMERIC, y),
        z_index = COALESCE((p_updates->>'z_index')::INTEGER, z_index),
        metadata = COALESCE((p_updates->'metadata')::JSONB, metadata),
        item_type = COALESCE(p_updates->>'item_type', item_type)
    WHERE id = p_id;
    
    -- Get updated item
    SELECT row_to_json(ci.*) INTO v_item
    FROM public.canvas_items ci
    WHERE ci.id = p_id;
    
    SELECT version INTO v_current_version
    FROM public.canvas_items
    WHERE id = p_id;
    
    RETURN QUERY SELECT TRUE, v_current_version, v_item;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION update_canvas_item_with_version IS 
'Updates a canvas item with optimistic locking. Returns success=false if version mismatch.';
