# Manual Migration Instructions

## Overview
This document provides instructions for manually running SQL migrations on Supabase.

---

## Migration 014: Tighten RLS Policies (SECURITY - HIGH PRIORITY)

**File:** `014_tighten_rls_policies.sql`

**Purpose:**
- Fix security issue where all organizations are publicly viewable
- Add missing RLS policies for AI tables
- Add missing RLS policies for organization management tables

**Impact:**
- ✅ Restricts organization data to members only
- ✅ Protects AI insights, logs, and feedback
- ✅ Secures organization invitations and membership data
- ⚠️ Breaking change: Public organization viewing is no longer allowed

**How to Run:**

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `014_tighten_rls_policies.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. Verify no errors in the output

### Option 2: Supabase CLI
```bash
cd edeastorm
supabase db push --file supabase/migrations/014_tighten_rls_policies.sql
```

### Option 3: psql (Direct Connection)
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" < supabase/migrations/014_tighten_rls_policies.sql
```

---

## Verification Steps

After running the migration, verify the policies are correctly applied:

### 1. Check RLS is Enabled
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'organizations',
  'ai_insights',
  'ai_processing_logs',
  'ai_feedback',
  'organization_invitations',
  'organization_members'
);
```

**Expected Result:** All tables should show `rowsecurity = true`

### 2. Check Organization Policies
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'organizations'
ORDER BY policyname;
```

**Expected Result:** Should see policy "Organizations viewable by members" (not "Organizations are viewable by everyone")

### 3. Check AI Insights Policies
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'ai_insights'
ORDER BY policyname;
```

**Expected Result:** Should see 4 policies (SELECT, INSERT, UPDATE, DELETE)

### 4. Test Organization Access
```sql
-- Test that you can only see your own organization
SELECT id, name, slug
FROM organizations;
```

**Expected Result:** Should only return organizations you're a member of (not all organizations)

---

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Restore old organization policy (NOT RECOMMENDED FOR PRODUCTION)
DROP POLICY IF EXISTS "Organizations viewable by members" ON public.organizations;
CREATE POLICY "Organizations are viewable by everyone"
ON public.organizations FOR SELECT
USING (true);

-- Remove AI policies
DROP POLICY IF EXISTS "View AI insights on accessible boards" ON public.ai_insights;
DROP POLICY IF EXISTS "Create AI insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Update AI insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Delete AI insights" ON public.ai_insights;

-- Continue for other tables as needed...
```

---

## Troubleshooting

### Error: "permission denied for table X"
**Cause:** RLS is blocking your query because you're not authenticated properly

**Solution:** Make sure you're running queries with a proper authenticated user context, or use the service role key for testing

### Error: "policy X already exists"
**Cause:** Policy was already created in a previous run

**Solution:** The migration uses `DROP POLICY IF EXISTS` to handle this. If you still see this error, manually drop the policy first:
```sql
DROP POLICY "policy_name" ON table_name;
```

### Error: "function check_board_access does not exist"
**Cause:** The `check_board_access` function from migration 002 is missing

**Solution:** Re-run migration `002_create_functions.sql` first

---

## Next Steps

After successfully running this migration:

1. ✅ Mark Epic 1, Task 1.3 as complete in your tracking
2. ➡️ Proceed with code-level security fixes (board access checks in AI routes)
3. ➡️ Test the application to ensure no legitimate access is blocked
4. ➡️ Monitor logs for any policy violations

---

## Questions?

If you encounter issues running this migration:
1. Check the Supabase logs in the dashboard
2. Verify you have the correct permissions (postgres role or service role)
3. Ensure all previous migrations (001-013) were applied successfully
