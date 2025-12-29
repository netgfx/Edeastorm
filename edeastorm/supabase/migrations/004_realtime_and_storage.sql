-- IdeaFlow Realtime & Storage Configuration
-- Migration: 004_realtime_and_storage.sql
-- Description: Sets up realtime publication and storage buckets

--------------------------------------------
-- REALTIME PUBLICATION
--------------------------------------------
-- Enable realtime for specific tables
-- Note: This is for Supabase Realtime (Postgres Changes)

-- Create publication for realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.canvas_items,
    public.room_users,
    public.boards;

-- Enable replica identity for realtime updates
ALTER TABLE public.canvas_items REPLICA IDENTITY FULL;
ALTER TABLE public.room_users REPLICA IDENTITY FULL;
ALTER TABLE public.boards REPLICA IDENTITY FULL;

--------------------------------------------
-- STORAGE BUCKETS
--------------------------------------------
-- Create storage bucket for board assets (images, files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'board-assets',
    'board-assets',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152, -- 2MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage bucket for board thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'thumbnails',
    'thumbnails',
    true,
    1048576, -- 1MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

--------------------------------------------
-- STORAGE POLICIES
--------------------------------------------
-- Board Assets: Anyone can view, authenticated users with board access can upload
CREATE POLICY "Public read access for board assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'board-assets');

CREATE POLICY "Authenticated users can upload board assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'board-assets'
    AND (storage.foldername(name))[1] IN (
        SELECT short_id FROM public.boards b
        WHERE EXISTS (
            SELECT 1 FROM (SELECT * FROM check_board_access(b.id, auth.uid())) AS access
            WHERE access.has_access = true AND access.access_role IN ('contributor', 'editor', 'admin')
        )
    )
);

CREATE POLICY "Board editors can delete assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'board-assets'
    AND (storage.foldername(name))[1] IN (
        SELECT short_id FROM public.boards b
        WHERE EXISTS (
            SELECT 1 FROM (SELECT * FROM check_board_access(b.id, auth.uid())) AS access
            WHERE access.has_access = true AND access.access_role IN ('editor', 'admin')
        )
    )
);

-- Avatars: Public read, users can manage their own
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Thumbnails: Public read, board creators can manage
CREATE POLICY "Public read access for thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

CREATE POLICY "Board creators can upload thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'thumbnails'
    AND (storage.foldername(name))[1] IN (
        SELECT short_id FROM public.boards WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Board creators can update thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'thumbnails'
    AND (storage.foldername(name))[1] IN (
        SELECT short_id FROM public.boards WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Board creators can delete thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'thumbnails'
    AND (storage.foldername(name))[1] IN (
        SELECT short_id FROM public.boards WHERE created_by = auth.uid()
    )
);
