-- Fix Board Images RLS Policies
-- Run this in Supabase Dashboard SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view board images" ON public.board_images;
DROP POLICY IF EXISTS "Public can view board images" ON public.board_images;
DROP POLICY IF EXISTS "Board creators can upload images" ON public.board_images;
DROP POLICY IF EXISTS "Board creators can update image metadata" ON public.board_images;
DROP POLICY IF EXISTS "Board creators can delete images" ON public.board_images;

-- Enable RLS
ALTER TABLE public.board_images ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view board images (no auth required since using NextAuth)
CREATE POLICY "Anyone can view board images"
ON public.board_images FOR SELECT
USING (true);

-- Policy 2: Board creator can insert images
CREATE POLICY "Board creators can upload images"
ON public.board_images FOR INSERT
TO authenticated
WITH CHECK (
    board_id IN (
        SELECT id FROM public.boards
        WHERE created_by = auth.uid()
    )
);

-- Policy 3: Board creator can update image metadata
CREATE POLICY "Board creators can update image metadata"
ON public.board_images FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.boards
        WHERE id = board_id
        AND created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.boards
        WHERE id = board_id
        AND created_by = auth.uid()
    )
);

-- Policy 4: Board creator can delete images
CREATE POLICY "Board creators can delete images"
ON public.board_images FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.boards
        WHERE id = board_id
        AND created_by = auth.uid()
    )
);
