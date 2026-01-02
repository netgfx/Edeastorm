
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const userId = 'aa291173-aa56-4e69-8342-921d07936316';

async function debug() {
  try {
    await client.connect();
    console.log(`Checking for user: ${userId}`);

    // 1. Check Profile
    const resProfile = await client.query('SELECT * FROM public.profiles WHERE id = $1', [userId]);
    console.log('Profile found:', resProfile.rows.length > 0);
    if (resProfile.rows.length > 0) {
        console.log('Profile Org ID:', resProfile.rows[0].organization_id);
    }

    // 2. Check Organization Members
    const resMembers = await client.query('SELECT * FROM public.organization_members WHERE user_id = $1', [userId]);
    console.log('Organization Members found:', resMembers.rows.length);
    console.log(resMembers.rows);

    // 3. Check Boards
    const resBoards = await client.query('SELECT id, title, organization_id, created_by FROM public.boards WHERE created_by = $1', [userId]);
    console.log('Boards created by user:', resBoards.rows.length);
    console.log(resBoards.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

debug();
