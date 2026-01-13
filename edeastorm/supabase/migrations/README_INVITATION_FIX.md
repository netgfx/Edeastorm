# Invitation Race Condition Fix

## Issue Description

When a new user was invited to an organization and signed up using Google OAuth:

1. The invitation email was sent with a token
2. User clicked the link and signed in with Google (sometimes with timeout issues)
3. During Google sign-in, the `signIn` callback created a Supabase Auth user and profile
4. The database trigger `handle_new_profile_organization()` automatically created a **new personal organization** for the user
5. The user was assigned to their own organization instead of the invited organization
6. When the invitation acceptance flow completed, the user was either:
   - Not added to the invited organization at all
   - Added but still had their personal org as primary

## Root Cause

The database trigger fired on profile creation and didn't check for pending invitations. It always created a personal organization for new users, regardless of whether they had been invited to join an existing organization.

## Solution

### 1. Updated Database Trigger (Migration 015)

Modified `handle_new_profile_organization()` to:
- Check for pending invitations **before** creating a personal organization
- If a pending invitation exists:
  - Assign the user to the invited organization
  - Set their role from the invitation
  - Add them as a member to the organization
  - Keep the invitation record for the accept flow to clean up
- Only create a personal organization if no pending invitation exists

### 2. Updated Auth Callback

Modified the `signIn` callback in [auth.ts](../src/lib/auth.ts) to:
- Check for pending invitations before creating a profile
- Log when an invitation is found for better debugging
- Let the database trigger handle the organization assignment

### 3. Updated Invitation Accept Endpoint

Modified [accept/route.ts](../src/app/api/invitations/[token]/accept/route.ts) to:
- Check if the user is already a member (added by trigger) before attempting to add them
- Avoid duplicate inserts and conflicts
- Clean up the invitation record after successful acceptance

## Flow After Fix

### New User with Invitation

1. User receives invitation email with token
2. Clicks link → `/invite/accept?token=xxx`
3. Clicks "Sign in to Accept Invitation"
4. Redirected to Google OAuth
5. **During OAuth callback:**
   - Supabase Auth user created
   - `signIn` callback checks for pending invitation (finds it)
   - Profile insert triggered
   - **Database trigger detects pending invitation**
   - User assigned to invited organization (NOT personal org)
   - User added as member with invitation role
6. Returns to `/invite/complete?token=xxx`
7. Accept endpoint:
   - Validates invitation
   - Checks if already a member (yes, from trigger)
   - Deletes invitation record
   - Redirects to dashboard
8. User is now a member of the invited organization ✓

### New User without Invitation

1. User signs up normally
2. **During OAuth callback:**
   - Supabase Auth user created
   - `signIn` callback checks for pending invitation (none found)
   - Profile insert triggered
   - **Database trigger finds no invitation**
   - Creates personal "My Workspace" organization
   - User added as admin of personal org
3. User can use the platform with their own workspace ✓

## Testing Checklist

- [ ] Invite a new user (no existing account)
- [ ] New user signs up with Google OAuth
- [ ] Verify user is added to invited organization (not personal org)
- [ ] Verify user has correct role from invitation
- [ ] Verify invitation is deleted after acceptance
- [ ] Verify inviter can see the new member in their organization
- [ ] Test with OAuth timeout/retry scenario
- [ ] Verify existing users still get personal orgs on first signup

## Files Modified

1. `edeastorm/supabase/migrations/015_fix_invitation_race_condition.sql` - Fixed trigger
2. `edeastorm/src/lib/auth.ts` - Added invitation check in signIn callback
3. `edeastorm/src/app/api/invitations/[token]/accept/route.ts` - Check for existing membership

## Deployment

Run the migration:
```bash
cd edeastorm
npx supabase db push
```

Or manually apply the migration in your Supabase dashboard.
