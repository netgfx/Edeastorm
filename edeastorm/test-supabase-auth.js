/** @format */

// Script to test Supabase Auth user creation
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const { createClient } = require("@supabase/supabase-js");

async function testSupabaseAuth() {
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
    console.log("📋 Listing all Supabase Auth users...\n");

    const { data: authUsers, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("❌ Error listing users:", error);
      return;
    }

    console.log(`Found ${authUsers.users.length} users in Supabase Auth:\n`);

    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   Provider: ${user.app_metadata?.provider || "email"}`);
      console.log(`   Confirmed: ${user.email_confirmed_at ? "✓" : "✗"}`);
      console.log("");
    });

    // Also check profiles table
    console.log("📋 Listing all profiles...\n");

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at");

    if (profileError) {
      console.error("❌ Error listing profiles:", profileError);
      return;
    }

    console.log(`Found ${profiles.length} profiles:\n`);

    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. Email: ${profile.email}`);
      console.log(`   ID: ${profile.id}`);
      console.log(`   Name: ${profile.full_name}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Created: ${new Date(profile.created_at).toLocaleString()}`);
      console.log("");
    });

    // Check for orphaned profiles (profiles without auth users)
    console.log("🔍 Checking for orphaned profiles...\n");

    const authUserIds = authUsers.users.map((u) => u.id);
    const orphanedProfiles = profiles.filter(
      (p) => !authUserIds.includes(p.id)
    );

    if (orphanedProfiles.length > 0) {
      console.log(`⚠️  Found ${orphanedProfiles.length} orphaned profiles:`);
      orphanedProfiles.forEach((p) => {
        console.log(`   - ${p.email} (ID: ${p.id})`);
      });
    } else {
      console.log("✅ No orphaned profiles found");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testSupabaseAuth();
