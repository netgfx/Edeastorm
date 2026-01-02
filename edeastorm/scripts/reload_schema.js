
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function reload() {
  try {
    await client.connect();
    await client.query("NOTIFY pgrst, 'reload config'");
    console.log('Reloaded schema cache.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

reload();
