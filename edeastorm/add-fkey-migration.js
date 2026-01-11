/** @format */

// Script to re-add foreign key constraint to profiles table
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  const supabase = createClient(
    `https://qxlpjyccgyhxmewlitxh.supabase.co`,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    console.log("🔍 Checking current state...\n");

    // Check for orphaned profiles first
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email");

    if (profileError) {
      console.error("❌ Error fetching profiles:", profileError);
      return;
    }

    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error fetching auth users:", authError);
      return;
    }

    const authUserIds = authUsers.users.map((u) => u.id);
    const orphanedProfiles = profiles.filter(
      (p) => !authUserIds.includes(p.id)
    );

    if (orphanedProfiles.length > 0) {
      console.log(
        `⚠️  WARNING: Found ${orphanedProfiles.length} orphaned profiles:`
      );
      orphanedProfiles.forEach((p) => {
        console.log(`   - ${p.email} (ID: ${p.id})`);
      });
      console.log(
        "\n❌ Cannot add foreign key constraint with orphaned profiles."
      );
      console.log(
        "   You need to either delete these profiles or create auth users for them.\n"
      );
      return;
    }

    console.log("✅ No orphaned profiles found\n");

    // Read and execute migration
    const migrationPath = path.join(
      __dirname,
      "supabase",
      "migrations",
      "003_add_profiles_fkey.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("📝 Running migration: 003_add_profiles_fkey.sql");
    console.log("SQL:", sql);
    console.log("\n");

    // Execute via RPC to run raw SQL
    const { error: execError } = await supabase.rpc("exec_sql", {
      sql_query: sql,
    });

    if (execError) {
      // If RPC doesn't exist, try direct approach
      console.log(
        "RPC method not available, you'll need to run this SQL manually in Supabase dashboard:\n"
      );
      console.log(sql);
      console.log(
        "\n📋 Go to: https://supabase.com/dashboard/project/qxlpjyccgyhxmewlitxh/sql"
      );
    } else {
      console.log("✅ Migration completed successfully!");
      console.log("Foreign key constraint has been re-added to profiles table.");
    }
  } catch (error) {
    console.error("❌ Migration failed:");
    console.error(error.message);
    console.error(error);
  }
}

runMigration();
