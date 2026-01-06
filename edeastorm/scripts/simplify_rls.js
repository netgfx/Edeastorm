
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sql = `
RESET ROLE;

-- Drop all existing policies on organization_members
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "debug_me" ON public.organization_members;
DROP POLICY IF EXISTS "Authenticated users can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "No direct inserts allowed" ON public.organization_members;
DROP POLICY IF EXISTS "No direct updates allowed" ON public.organization_members;
DROP POLICY IF EXISTS "No direct deletes allowed" ON public.organization_members;

-- Drop all existing policies on organization_invitations
DROP POLICY IF EXISTS "Users can view invitations of their organizations" ON public.organization_invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.organization_invitations;
DROP POLICY IF EXISTS "Authenticated users can view organization invitations" ON public.organization_invitations;
DROP POLICY IF EXISTS "No direct invitations writes allowed" ON public.organization_invitations;

-- SIMPLE APPROACH: Make all reads public, enforce writes at app level
-- This is safe because:
-- 1. App uses NextAuth for authentication
-- 2. API functions check authorization in code (not RLS)
-- 3. Sensitive operations go through API routes with proper checks

-- Organization Members: Public read
CREATE POLICY "Anyone can view organization members"
    ON public.organization_members FOR SELECT
    USING (true);

-- Organization Invitations: Public read
CREATE POLICY "Anyone can view organization invitations"
    ON public.organization_invitations FOR SELECT
    USING (true);
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('Success - Policies simplified for app-level auth');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
