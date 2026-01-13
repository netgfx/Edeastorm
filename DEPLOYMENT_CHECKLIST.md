# Deployment Checklist - Activity Logging & Invitation Fix

## Pre-Deployment

### 1. Database Migration
- [ ] Review migration file: `edeastorm/supabase/migrations/015_fix_invitation_race_condition.sql`
- [ ] Backup production database
- [ ] Test migration on staging environment first
- [ ] Apply migration to production:
  ```bash
  cd edeastorm
  npx supabase db push
  ```
- [ ] Verify trigger is created: `handle_new_profile_organization()`
- [ ] Verify activity_log inserts work

### 2. Code Deployment
- [ ] Review all modified files (listed below)
- [ ] Run build locally to check for TypeScript errors:
  ```bash
  cd edeastorm
  npm run build
  ```
- [ ] Commit and push changes
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging

### 3. Environment Variables
- [ ] No new environment variables required
- [ ] Verify existing Supabase credentials are correct
- [ ] Verify NextAuth configuration is correct

## Post-Deployment Testing

### Test Invitation Flow
1. [ ] Invite a new user with a fresh email address
2. [ ] Have them click the invitation link
3. [ ] Sign up with Google OAuth (or GitHub)
4. [ ] Verify they are added to the invited organization (not personal)
5. [ ] Check inviter's organization shows new member
6. [ ] Check activity log shows:
   - `user.profile_created` with `via_invitation: true`
   - `org.invitation_accepted`

### Test Activity Logging

#### Authentication
1. [ ] Sign in - verify `auth.login` logged
2. [ ] Sign out - verify `auth.logout` logged (if implemented)
3. [ ] Failed login - verify `auth.login_failed` logged
4. [ ] New signup - verify `auth.signup` logged

#### Organization
1. [ ] Send invitation - verify `org.invitation_sent` logged
2. [ ] Add existing user - verify `org.member_added` logged
3. [ ] Accept invitation - verify `org.invitation_accepted` logged

#### API Access
1. [ ] Test logging endpoint:
   ```bash
   curl -X POST https://your-domain.com/api/activity/log \
     -H "Content-Type: application/json" \
     -d '{"action":"test.action","metadata":{"test":true}}'
   ```
2. [ ] Test fetch endpoint:
   ```bash
   curl https://your-domain.com/api/activity?limit=10
   ```

#### UI Components
1. [ ] Access activity log UI (create a test page if needed)
2. [ ] Verify activities display correctly
3. [ ] Test filters (action type, date range)
4. [ ] Test pagination

### Test Security
1. [ ] Verify users can only see their organization's activities
2. [ ] Test unauthorized access returns 401/403
3. [ ] Verify sensitive data (passwords) is not logged
4. [ ] Check IP addresses are captured correctly
5. [ ] Verify failed operations are logged

### Performance Testing
1. [ ] Check activity_log table indexes exist:
   - `idx_activity_log_board`
   - `idx_activity_log_user`
   - `idx_activity_log_created_at`
2. [ ] Monitor query performance for activity fetching
3. [ ] Verify logging doesn't slow down main operations

## Rollback Plan

If issues are discovered:

### Rollback Database Migration
```sql
-- Revert to old trigger function
DROP FUNCTION IF EXISTS public.handle_new_profile_organization() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_profile_organization()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    base_slug TEXT;
    final_slug TEXT;
    counter INT := 0;
BEGIN
    IF NEW.organization_id IS NULL THEN
        base_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
        IF base_slug = '' THEN base_slug := 'user'; END IF;

        final_slug := base_slug;

        WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
            counter := counter + 1;
            final_slug := base_slug || counter::text;
        END LOOP;

        INSERT INTO public.organizations (name, slug)
        VALUES ('My Workspace', final_slug)
        RETURNING id INTO new_org_id;

        NEW.organization_id := new_org_id;

        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (new_org_id, NEW.id, 'admin');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_profile_created_create_org ON public.profiles;
CREATE TRIGGER on_profile_created_create_org
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_profile_organization();
```

### Rollback Code
```bash
git revert <commit-hash>
git push
```

## Monitoring

### What to Monitor After Deployment

1. **Activity Log Growth**
   - Monitor `activity_log` table size
   - Check for unexpected spikes in logging
   - Verify logs are being created correctly

2. **Invitation Flow**
   - Monitor successful invitation acceptances
   - Check for users getting wrong organizations
   - Watch for failed profile creations

3. **Performance**
   - API response times for activity endpoints
   - Database query performance on activity_log
   - Impact on auth callback performance

4. **Error Logs**
   - Console errors related to activity logging
   - Failed log inserts
   - Permission errors on activity fetching

### Metrics to Track

```sql
-- Activity log statistics
SELECT
  action,
  COUNT(*) as count,
  DATE_TRUNC('day', created_at) as day
FROM activity_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY action, day
ORDER BY day DESC, count DESC;

-- Invitation success rate
SELECT
  COUNT(CASE WHEN metadata->>'via_invitation' = 'true' THEN 1 END) as via_invitation,
  COUNT(CASE WHEN metadata->>'via_invitation' = 'false' THEN 1 END) as direct_signup
FROM activity_log
WHERE action = 'user.profile_created'
  AND created_at > NOW() - INTERVAL '7 days';

-- Auth events
SELECT
  action,
  COUNT(*) as count
FROM activity_log
WHERE action LIKE 'auth.%'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY action;
```

## Files Modified/Created

### Database
- ✅ `edeastorm/supabase/migrations/015_fix_invitation_race_condition.sql`

### Server-Side
- ✅ `edeastorm/src/lib/activity-logger.ts` (new)
- ✅ `edeastorm/src/lib/activity/index.ts` (new)
- ✅ `edeastorm/src/lib/auth.ts` (modified)
- ✅ `edeastorm/src/app/api/activity/log/route.ts` (new)
- ✅ `edeastorm/src/app/api/activity/route.ts` (new)
- ✅ `edeastorm/src/app/api/organizations/[orgId]/invite/route.ts` (modified)
- ✅ `edeastorm/src/app/api/invitations/[token]/accept/route.ts` (modified)

### Client-Side
- ✅ `edeastorm/src/store/activityStore.ts` (new)
- ✅ `edeastorm/src/hooks/useActivityLogger.ts` (new)
- ✅ `edeastorm/src/components/activity/ActivityLog.tsx` (new)
- ✅ `edeastorm/src/components/providers/ActivityProvider.tsx` (new)

### Documentation
- ✅ `docs/ACTIVITY_LOGGING.md` (new)
- ✅ `docs/IMPLEMENTATION_SUMMARY.md` (new)
- ✅ `edeastorm/supabase/migrations/README_INVITATION_FIX.md` (new)
- ✅ `IMPLEMENTATION_PLAN_V1.0.md` (updated)
- ✅ `README.md` (updated)

## Success Criteria

Deployment is successful when:
- [x] Database migration applied without errors
- [ ] All tests passing
- [ ] Invited users join correct organizations
- [ ] Activity logs are being created
- [ ] Activity log UI displays correctly
- [ ] No performance degradation
- [ ] No new errors in logs
- [ ] Monitoring shows expected metrics

## Support Contacts

- **Technical Issues:** Check console logs, Supabase logs
- **Migration Issues:** Review migration SQL, check trigger exists
- **Activity Logging Issues:** Check `activity_log` table, verify RLS policies

## Notes

- Activity logging is designed to never break main flow (try-catch everywhere)
- Failed logs are queued for retry on client-side
- Database trigger logs automatically on profile creation
- All auth events are logged automatically
- Activity log viewing requires organization membership
