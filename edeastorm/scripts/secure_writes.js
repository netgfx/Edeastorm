
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sql = `
RESET ROLE;

-- ==============================================
-- ORGANIZATION_MEMBERS: Secure writes
-- ==============================================

-- Explicitly deny all writes (they must go through app API)
CREATE POLICY "Deny all inserts to organization_members"
    ON public.organization_members FOR INSERT
    WITH CHECK (false);

CREATE POLICY "Deny all updates to organization_members"
    ON public.organization_members FOR UPDATE
    USING (false);

CREATE POLICY "Deny all deletes to organization_members"
    ON public.organization_members FOR DELETE
    USING (false);

-- ==============================================
-- ORGANIZATION_INVITATIONS: Secure writes
-- ==============================================

-- Explicitly deny all writes (they must go through app API)
CREATE POLICY "Deny all inserts to organization_invitations"
    ON public.organization_invitations FOR INSERT
    WITH CHECK (false);

CREATE POLICY "Deny all updates to organization_invitations"
    ON public.organization_invitations FOR UPDATE
    USING (false);

CREATE POLICY "Deny all deletes to organization_invitations"
    ON public.organization_invitations FOR DELETE
    USING (false);

-- ==============================================
-- BOARDS: Restrict creation to authenticated users only
-- ==============================================

-- Drop the old "anyone can create" policy
DROP POLICY IF EXISTS "Anyone can create boards" ON public.boards;

-- Only authenticated users (those with a valid Supabase session) can create boards
CREATE POLICY "Only authenticated users can create boards"
    ON public.boards FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Users can only update their own boards
CREATE POLICY "Users can only update their own boards"
    ON public.boards FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Users can only delete their own boards  
CREATE POLICY "Users can only delete their own boards"
    ON public.boards FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('Success - Secured write policies');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
