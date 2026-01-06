require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to database.');

    const migrationDir = path.join(__dirname, '../supabase/migrations');
    if (!fs.existsSync(migrationDir)) {
        console.error('Migration directory not found:', migrationDir);
        process.exit(1);
    }

    const files = fs.readdirSync(migrationDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`Running migration: ${file}`);
        const filePath = path.join(migrationDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        try {
            await client.query(sql);
            console.log(`Finished migration: ${file}`);
        } catch (e) {
            console.error(`Error in migration ${file}:`, e.message);
            // Don't exit, might be "relation already exists"
        }
      }
    }

    console.log('Migration process finished.');
  } catch (err) {
    console.error('Migration script error:', err);
  } finally {
    await client.end();
  }
}

migrate();
