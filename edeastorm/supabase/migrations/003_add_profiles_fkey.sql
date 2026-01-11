-- Re-add foreign key constraint from profiles.id to auth.users
-- This is safe now because NextAuth creates corresponding Supabase Auth users
-- in the signIn callback, ensuring all profile IDs exist in auth.users

-- Add the foreign key constraint back
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- This ensures:
-- 1. Every profile corresponds to a valid auth user
-- 2. Profiles are automatically deleted when auth user is deleted
-- 3. Data integrity is maintained
-- 4. RLS policies using auth.uid() work correctly
