
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sql = `
RESET ROLE;

DROP POLICY IF EXISTS "debug_me" ON public.organization_members;

CREATE OR REPLACE FUNCTION public.get_my_org_ids()
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN ARRAY(
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_admin_org_ids()
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN ARRAY(
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$;
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('Success');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
