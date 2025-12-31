-- Board Images Feature
-- Migration: 007_board_images.sql
-- Description: Adds support for board creators to upload reference images

--------------------------------------------
-- 1. BOARD_IMAGES TABLE
--------------------------------------------
-- Stores reference images uploaded by board creators
CREATE TABLE IF NOT EXISTS public.board_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL, -- Path in Supabase storage
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_board_images_board ON public.board_images(board_id);
CREATE INDEX idx_board_images_order ON public.board_images(board_id, display_order);

--------------------------------------------
-- 2. STORAGE BUCKET FOR BOARD IMAGES
--------------------------------------------
-- Create dedicated bucket for board reference images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'board-images',
    'board-images',
    true,
    10485760, -- 10MB limit per image
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

--------------------------------------------
-- 3. STORAGE POLICIES FOR BOARD IMAGES
--------------------------------------------
-- Public read access for all board images
CREATE POLICY "Public read access for board images"
ON storage.objects FOR SELECT
USING (bucket_id = 'board-images');

-- Only board creator can upload images
CREATE POLICY "Board creators can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'board-images'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.boards
        WHERE created_by = auth.uid()
    )
);

-- Only board creator can update images
CREATE POLICY "Board creators can update their images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'board-images'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.boards
        WHERE created_by = auth.uid()
    )
);

-- Only board creator can delete images
CREATE POLICY "Board creators can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'board-images'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.boards
        WHERE created_by = auth.uid()
    )
);

--------------------------------------------
-- 4. RLS POLICIES FOR BOARD_IMAGES TABLE
--------------------------------------------
-- Enable RLS
ALTER TABLE public.board_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view board images if they have board access
CREATE POLICY "Users can view board images"
ON public.board_images FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.boards b
        WHERE b.id = board_images.board_id
        AND (
            b.is_public = true
            OR EXISTS (
                SELECT 1 FROM check_board_access(b.id, auth.uid()) access
                WHERE access.has_access = true
            )
        )
    )
);

-- Only board creator can insert images
CREATE POLICY "Board creators can upload images"
ON public.board_images FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.boards
        WHERE id = board_images.board_id
        AND created_by = auth.uid()
    )
);

-- Only board creator can update image metadata
CREATE POLICY "Board creators can update image metadata"
ON public.board_images FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.boards
        WHERE id = board_images.board_id
        AND created_by = auth.uid()
    )
);

-- Only board creator can delete images
CREATE POLICY "Board creators can delete images"
ON public.board_images FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.boards
        WHERE id = board_images.board_id
        AND created_by = auth.uid()
    )
);

--------------------------------------------
-- 5. FUNCTIONS
--------------------------------------------
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_board_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_board_images_updated_at_trigger
BEFORE UPDATE ON public.board_images
FOR EACH ROW
EXECUTE FUNCTION update_board_images_updated_at();

-- Function to reorder images after deletion
CREATE OR REPLACE FUNCTION reorder_board_images_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.board_images
    SET display_order = display_order - 1
    WHERE board_id = OLD.board_id
    AND display_order > OLD.display_order;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reordering
CREATE TRIGGER reorder_board_images_trigger
AFTER DELETE ON public.board_images
FOR EACH ROW
EXECUTE FUNCTION reorder_board_images_on_delete();

--------------------------------------------
-- 6. ENABLE REALTIME FOR BOARD_IMAGES
--------------------------------------------
-- Add board_images to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_images;
ALTER TABLE public.board_images REPLICA IDENTITY FULL;

-- Add comment
COMMENT ON TABLE public.board_images IS 'Reference images uploaded by board creators for participants to view and ideate upon';
