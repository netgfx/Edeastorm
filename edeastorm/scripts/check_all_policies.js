
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAllPolicies() {
  try {
    await client.connect();
    
    const tables = ['organization_members', 'organization_invitations', 'boards'];
    
    for (const table of tables) {
      console.log(`\n=== Policies for ${table} ===`);
      const res = await client.query(`
        SELECT policyname, cmd, qual, with_check
        FROM pg_policies
        WHERE tablename = $1
        ORDER BY cmd, policyname
      `, [table]);
      
      if (res.rows.length === 0) {
        console.log('NO POLICIES FOUND - All operations are DENIED by default');
      } else {
        res.rows.forEach(row => {
          console.log(`${row.cmd} - ${row.policyname}`);
          console.log(`  USING: ${row.qual}`);
          console.log(`  WITH CHECK: ${row.with_check}`);
        });
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkAllPolicies();
