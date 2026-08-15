# Activity Logging System

A comprehensive, centralized activity logging system for security, compliance, and audit purposes.

## Overview

The activity logging system tracks all significant user actions including:
- Authentication events (login, logout, signup, failed attempts)
- User management (profile creation, updates)
- Organization activities (invitations, member management)
- Board access and modifications
- Security events (permission denials, suspicious activity)

## Architecture

### Components

1. **Centralized Logger** (`src/lib/activity-logger.ts`)
   - Singleton pattern for consistent logging
   - Type-safe activity actions and entity types
   - Automatic metadata extraction from requests
   - Never throws - logging failures don't break main flow

2. **Zustand Store** (`src/store/activityStore.ts`)
   - Client-side activity state management
   - Activity queue for batch processing
   - Session tracking
   - Filters for activity viewer

3. **API Endpoints**
   - `POST /api/activity/log` - Log activity from client
   - `GET /api/activity` - Fetch activities with filters

4. **React Components**
   - `ActivityLog` - Viewer component with filters and pagination
   - `useActivityLogger` - Hook for logging from components
   - `useSessionActivity` - Hook for session tracking

5. **Database Integration**
   - Automatic logging in database triggers
   - Profile creation logs via trigger
   - Uses existing `activity_log` table

## Usage

### Server-Side Logging

```typescript
import { activityLogger, ActivityActions } from "@/lib/activity-logger";

// In API routes
export async function POST(request: NextRequest) {
  const session = await auth();

  // Log activity
  await activityLogger.logAuth(
    ActivityActions.AUTH_LOGIN,
    session.user.id,
    {
      ...activityLogger.extractRequestMetadata(request),
      provider: "google",
    }
  );
}

// Or use convenience functions
import { logAuthLogin, logInvitationSent } from "@/lib/activity-logger";

await logAuthLogin(userId, "google", { email: user.email });
await logInvitationSent(inviterId, orgId, email, role);
```

### Client-Side Logging

```typescript
import { useActivityLogger } from "@/hooks/useActivityLogger";

function MyComponent() {
  const { logActivity, logBoardAccess, ActivityActions } = useActivityLogger();

  const handleBoardOpen = async (boardId: string) => {
    // Log board access
    await logBoardAccess(boardId, {
      board_name: board.name,
    });
  };

  const handleCustomAction = async () => {
    await logActivity(ActivityActions.BOARD_UPDATED, {
      boardId: "board-123",
      metadata: {
        changes: ["title", "description"],
      },
    });
  };
}
```

### Session Tracking

```typescript
import { useSessionActivity } from "@/hooks/useActivityLogger";

function SessionProvider({ children }) {
  const { startSession, endSession } = useSessionActivity();

  useEffect(() => {
    startSession();
    return () => endSession();
  }, []);

  return children;
}
```

### Viewing Activity Logs

```typescript
import { ActivityLog } from "@/components/activity/ActivityLog";

function AdminDashboard() {
  return (
    <div>
      <h1>Activity Log</h1>
      <ActivityLog organizationId={orgId} limit={100} />
    </div>
  );
}
```

## Activity Types

### Authentication
- `auth.login` - User logged in
- `auth.logout` - User logged out
- `auth.signup` - New user signed up
- `auth.login_failed` - Failed login attempt
- `auth.session_expired` - Session expired

### User Management
- `user.profile_created` - User profile created
- `user.profile_updated` - Profile updated
- `user.password_changed` - Password changed
- `user.email_changed` - Email changed

### Organization
- `org.member_added` - Member added to organization
- `org.member_removed` - Member removed
- `org.member_role_changed` - Member role changed
- `org.invitation_sent` - Invitation sent
- `org.invitation_accepted` - Invitation accepted
- `org.invitation_declined` - Invitation declined
- `org.created` - Organization created
- `org.updated` - Organization updated

### Board Activities
- `board.accessed` - Board opened/accessed
- `board.created` - New board created
- `board.updated` - Board updated
- `board.deleted` - Board deleted
- `board.shared` - Board shared

### Security
- `security.permission_denied` - Permission denied
- `security.invalid_token` - Invalid token used
- `security.suspicious_activity` - Suspicious activity detected

## Metadata Structure

Activities can include rich metadata:

```typescript
interface ActivityMetadata {
  ip_address?: string;        // Auto-extracted from request
  user_agent?: string;         // Auto-extracted from request
  provider?: string;           // OAuth provider
  email?: string;              // User email
  organization_id?: string;    // Organization context
  organization_name?: string;  // Organization name
  role?: string;               // User role
  inviter_id?: string;         // Who initiated action
  error_message?: string;      // Error details
  previous_value?: any;        // Before state
  new_value?: any;             // After state
  [key: string]: any;          // Custom fields
}
```

## Database Schema

```sql
CREATE TABLE public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Automatic Logging

Some activities are logged automatically:

1. **Profile Creation** - Logged by database trigger
   - When user signs up via invitation
   - When user creates personal account

2. **Authentication** - Logged by auth callbacks
   - Login (successful)
   - Login (failed)
   - Signup

3. **Invitations** - Logged by API endpoints
   - Invitation sent
   - Invitation accepted
   - Member added directly

## Security & Privacy

1. **Sensitive Data**
   - Passwords are NEVER logged
   - PII is minimized (only user IDs, not full profiles)
   - Metadata can be redacted if needed

2. **Access Control**
   - Users can only view activities for their organizations
   - Organization members validated before viewing logs
   - Admin-only access can be enforced at component level

3. **Data Retention**
   - Consider implementing retention policies
   - Archive old logs for compliance
   - Implement cleanup jobs if needed

## Best Practices

1. **Always Log**
   - Security events (failed logins, permission denials)
   - User management (invitations, role changes)
   - Critical operations (deletions, exports)

2. **Never Log**
   - Passwords or credentials
   - Full tokens (only last 4 characters)
   - Sensitive user data

3. **Include Context**
   - Organization ID for multi-tenant filtering
   - IP address for security analysis
   - User agent for fraud detection

4. **Handle Failures**
   - Logging failures should never break main flow
   - Use try-catch in logger
   - Queue failed logs for retry

## Compliance

This system helps meet compliance requirements:

- **GDPR** - Tracks data access and modifications
- **SOC 2** - Audit trail for security controls
- **HIPAA** - Activity monitoring (if applicable)
- **ISO 27001** - Security event logging

## Future Enhancements

- [ ] Real-time activity streaming via WebSocket
- [ ] Anomaly detection (unusual patterns)
- [ ] Activity analytics dashboard
- [ ] Export to external SIEM systems
- [ ] Automated alerts for critical events
- [ ] Data retention and archival policies
- [ ] Activity replay for debugging

## Examples

### Example 1: Track Board Access

```typescript
// In board page component
useEffect(() => {
  if (boardId) {
    logBoardAccess(boardId, {
      board_name: board?.name,
      access_method: "direct_link",
    });
  }
}, [boardId]);
```

### Example 2: Track Failed Operations

```typescript
try {
  await deleteBoard(boardId);
} catch (error) {
  await activityLogger.logSecurity(
    ActivityActions.SECURITY_PERMISSION_DENIED,
    {
      user_id: userId,
      error_message: error.message,
      attempted_action: "delete_board",
      board_id: boardId,
    }
  );
  throw error;
}
```

### Example 3: Audit Trail for Role Changes

```typescript
await activityLogger.logOrganization(
  ActivityActions.ORG_MEMBER_ROLE_CHANGED,
  adminId,
  orgId,
  {
    member_id: memberId,
    previous_value: oldRole,
    new_value: newRole,
    changed_by: adminName,
  }
);
```

## Querying Activity Logs

```typescript
// Get recent activities
const activities = await fetch("/api/activity?limit=50");

// Filter by action
const logins = await fetch("/api/activity?action=auth.login");

// Filter by organization
const orgActivity = await fetch(`/api/activity?organization_id=${orgId}`);

// Filter by user
const userActivity = await fetch(`/api/activity?user_id=${userId}`);
```

## Troubleshooting

**Issue: Activities not appearing**
- Check that `supabaseAdmin()` is used (bypasses RLS)
- Verify user has organization membership
- Check console for logging errors

**Issue: Too much data**
- Implement pagination (already built in)
- Add more specific filters
- Consider archiving old data

**Issue: Performance concerns**
- Logging is async and non-blocking
- Failed logs are queued for retry
- Database indexes on key columns (user_id, created_at)

## Related Files

- `src/lib/activity-logger.ts` - Core logger
- `src/store/activityStore.ts` - Zustand store
- `src/app/api/activity/log/route.ts` - Logging endpoint
- `src/app/api/activity/route.ts` - Fetch endpoint
- `src/components/activity/ActivityLog.tsx` - Viewer component
- `src/hooks/useActivityLogger.ts` - React hooks
- `supabase/migrations/015_fix_invitation_race_condition.sql` - DB triggers
