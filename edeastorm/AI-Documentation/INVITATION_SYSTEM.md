# Organization Invitation System

## Overview

This document describes the complete organization member invitation system for EdeaStorm, including email invitations, user authentication integration, and Supabase Auth synchronization.

## Architecture

### Authentication Flow

1. **NextAuth Integration with Supabase Auth**
   - When users sign in via Google/GitHub through NextAuth, we create corresponding users in Supabase Auth
   - This ensures all users are tracked in Supabase's `auth.users` table
   - The foreign key constraint `profiles.id -> auth.users(id)` is maintained

2. **User Creation Process** ([auth.ts:64-147](src/lib/auth.ts#L64-L147))
   - On sign in, check if user exists in Supabase Auth
   - If not, create user with `supabase.auth.admin.createUser()`
   - Auto-confirm email since OAuth providers validate identity
   - Store metadata (full_name, avatar_url, provider)
   - Create profile with matching Supabase Auth user ID

### Invitation Flow

#### 1. Sending Invitations

**Endpoint**: `POST /api/organizations/[orgId]/invite`

**Process**:
1. Verify requester is admin/editor of organization
2. Check if invitee already has a profile
   - If yes: Add directly to `organization_members`
   - If no: Create invitation and send email
3. Generate secure random token
4. Store invitation in `organization_invitations` table
5. Send branded email via Brevo API

**Key Files**:
- [invite/route.ts](src/app/api/organizations/[orgId]/invite/route.ts) - API endpoint
- [email.ts](src/lib/email.ts) - Email service using Brevo REST API
- [OrganizationInvite.tsx](src/emails/OrganizationInvite.tsx) - React Email template

#### 2. Viewing Invitations

**Endpoint**: `GET /api/invitations/[token]`

**Returns**:
- Organization name
- Inviter name
- Invited email
- Role
- Expiration status

**Key File**: [invitations/[token]/route.ts](src/app/api/invitations/[token]/route.ts)

#### 3. Accepting Invitations

**Endpoint**: `POST /api/invitations/[token]/accept`

**Process**:
1. Verify user is authenticated
2. Validate invitation token and expiration
3. Confirm signed-in email matches invitation email
4. Check if profile exists by email
5. If no profile:
   - Create profile using `session.user.id` (Supabase Auth user ID)
   - Handle race conditions with retry logic
6. Add user to organization via `organization_members`
7. Delete used invitation

**Key Files**:
- [accept/route.ts](src/app/api/invitations/[token]/accept/route.ts) - API endpoint
- [accept/page.tsx](src/app/invite/accept/page.tsx) - UI for invitation acceptance

## Database Schema

### organization_invitations
```sql
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50),
  token VARCHAR(255) UNIQUE NOT NULL,
  invited_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### organization_members
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES profiles(id),
  role VARCHAR(50),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  organization_id UUID REFERENCES organizations(id),
  role VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Email Configuration

### Brevo API Setup

We use Brevo's REST API (not SMTP) for reliability:

**Environment Variables**:
```env
BREVO_API_KEY=xkeysib-...
NEXTAUTH_URL=http://localhost:3000
```

**Verified Sender**: `noreply@netgfx.com`

### Email Template

Built with [@react-email/components](https://react.email):
- Responsive HTML design
- EdeaStorm branding
- Role-specific descriptions
- Clear call-to-action button
- Support contact information

## Security Considerations

1. **Token Security**
   - Random tokens generated with `Math.random().toString(36) + Date.now().toString(36)`
   - Tokens expire after configurable period (default: 7 days)
   - One-time use (deleted after acceptance)

2. **Email Verification**
   - Must sign in with email matching invitation
   - Warning shown if signed in with different account

3. **Permission Checks**
   - Only org admins/editors can send invitations
   - RLS bypassed using `supabaseAdmin()` with permission checks

4. **Race Condition Handling**
   - Duplicate key errors handled gracefully
   - Retry logic for concurrent profile creation
   - Idempotent operations where possible

## Error Handling

### Common Errors

1. **Foreign Key Constraint (23503)**
   - Cause: Profile ID doesn't exist in `auth.users`
   - Solution: NextAuth signIn callback creates Supabase Auth users
   - Now: All user IDs are valid Supabase Auth user IDs

2. **Duplicate Key (23505)**
   - Cause: User already member or profile exists
   - Handled: Return success with appropriate message

3. **Expired Invitation (410)**
   - Cause: Invitation past expiration date
   - Response: Clear error message, suggest requesting new invite

4. **Email Mismatch (403)**
   - Cause: Signed in with different email
   - Response: Prompt to sign in with correct account

## Testing

### Test Scripts

1. **test-email.js** - Test email delivery via Brevo SMTP
2. **test-supabase-auth.js** - List Supabase Auth users and profiles
3. **run-migration.js** - Apply database migrations

### Manual Testing Flow

1. Sign in as organization admin
2. Navigate to organization settings
3. Send invitation to email address
4. Check recipient's email inbox
5. Click invitation link
6. Sign in (creates Supabase Auth user if new)
7. Accept invitation
8. Verify user appears in organization members

## Monitoring

### Logs to Watch

```bash
# Profile creation
"Creating Supabase Auth user for: user@example.com"
"Created Supabase Auth user with ID: ..."
"Profile not found for email: ... Session user ID: ..."

# Invitation acceptance
"Found existing profile: ... for email: ..."
"Profile found on retry: ..."

# Errors
"Error creating Supabase Auth user: ..."
"Error creating profile: ..."
```

### Database Queries

```sql
-- Check for orphaned profiles
SELECT p.* FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- Recent invitations
SELECT * FROM organization_invitations
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Organization members
SELECT
  p.email,
  p.full_name,
  om.role,
  om.joined_at
FROM organization_members om
JOIN profiles p ON om.user_id = p.id
WHERE om.organization_id = 'YOUR_ORG_ID'
ORDER BY om.joined_at DESC;
```

## Future Enhancements

1. **Batch Invitations** - Invite multiple emails at once
2. **Invitation Templates** - Pre-defined role/permission sets
3. **Invitation History** - Track sent invitations and outcomes
4. **Resend Invitations** - Regenerate expired tokens
5. **Custom Expiration** - Per-invitation expiration settings
6. **Audit Trail** - Log all invitation activities
7. **Email Preferences** - Allow users to customize invitation emails
8. **Slack/Teams Integration** - Send invitations via other channels

## Troubleshooting

### User not receiving emails

1. Check Brevo dashboard for delivery status
2. Verify `BREVO_API_KEY` is set correctly
3. Check sender email (`noreply@netgfx.com`) is verified
4. Look for errors in server logs

### Foreign key constraint errors

1. Ensure NextAuth signIn callback creates Supabase Auth users
2. Check `session.user.id` matches a valid `auth.users` ID
3. Verify user signed in after auth.ts changes deployed

### Profile already exists errors

1. Check if profile email is unique
2. Look for orphaned profiles (profile without auth user)
3. Verify profile creation logic handles duplicates

### Session issues

1. Sign out and sign in again to refresh session
2. Clear cookies and browser cache
3. Check `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set
4. Verify OAuth credentials are correct

## Support

For issues or questions:
- Email: support@edeastorm.app
- GitHub: [Report an issue](https://github.com/your-repo/issues)
