
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

-- Drop all existing policies on organization_invitations
DROP POLICY IF EXISTS "Users can view invitations of their organizations" ON public.organization_invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.organization_invitations;

-- NEW POLICIES: Simple approach for NextAuth integration
-- Since NextAuth is used, we can't rely on Supabase auth context
-- Instead, make organization_members and invitations viewable by authenticated users
-- (NextAuth provides auth at the app level)

-- Organization Members: Anyone authenticated can view
CREATE POLICY "Authenticated users can view organization members"
    ON public.organization_members FOR SELECT
    TO authenticated
    USING (true);

-- Organization Members: Only allow inserts via app logic (disabled for now)
CREATE POLICY "No direct inserts allowed"
    ON public.organization_members FOR INSERT
    WITH CHECK (false);

-- Organization Members: Only allow updates via app logic (disabled for now)
CREATE POLICY "No direct updates allowed"
    ON public.organization_members FOR UPDATE
    USING (false);

-- Organization Members: Only allow deletes via app logic (disabled for now)
CREATE POLICY "No direct deletes allowed"
    ON public.organization_members FOR DELETE
    USING (false);

-- Organization Invitations: Anyone authenticated can view
CREATE POLICY "Authenticated users can view organization invitations"
    ON public.organization_invitations FOR SELECT
    TO authenticated
    USING (true);

-- Organization Invitations: No direct writes (enforce via app)
CREATE POLICY "No direct invitations writes allowed"
    ON public.organization_invitations FOR INSERT
    WITH CHECK (false);
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('Success - Policies reset for NextAuth integration');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
