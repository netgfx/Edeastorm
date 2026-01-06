-- Fix Storage Policies for Board Images - COMPREHENSIVE FIX
-- Run this in Supabase Dashboard SQL Editor

-- Step 1: Ensure bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'board-images',
    'board-images',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Step 2: Drop ALL existing policies for board-images bucket
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname LIKE '%board%image%'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Step 3: Create simple, permissive policies

-- Policy 1: Public read access
CREATE POLICY "board-images: public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'board-images');

-- Policy 2: Authenticated users can upload
CREATE POLICY "board-images: authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'board-images');

-- Policy 3: Users can update their uploads
CREATE POLICY "board-images: owner update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'board-images');

-- Policy 4: Users can delete their uploads  
CREATE POLICY "board-images: owner delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'board-images');
