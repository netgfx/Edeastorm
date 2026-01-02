
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const userId = 'aa291173-aa56-4e69-8342-921d07936316';

async function debugRLS() {
  try {
    await client.connect();
    
    // Simulate Supabase Auth
    await client.query(`
      SET request.jwt.claim.sub = '${userId}';
      SET ROLE authenticated;
    `);

    console.log(`Simulating user: ${userId}`);

    // 1. Test the helper function directly
    try {
        const resFunc = await client.query('SELECT public.get_my_org_ids()');
        console.log('get_my_org_ids() result:', resFunc.rows[0]);
    } catch (e) {
        console.error('Error calling function:', e.message);
    }

    // 2. Test SELECT on organization_members
    try {
        const resMembers = await client.query('SELECT * FROM public.organization_members');
        console.log('SELECT * FROM organization_members count:', resMembers.rows.length);
        console.log(resMembers.rows);
    } catch (e) {
        console.error('Error querying table:', e.message);
    }

  } catch (err) {
    console.error('Script error:', err);
  } finally {
    await client.end();
  }
}

debugRLS();
