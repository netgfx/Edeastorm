<!-- @format -->

# Edeastorm

An ideation platform

## Recent Updates

### ✅ Fixed: Invitation Flow Race Condition (2026-01-13)
Fixed critical issue where invited users were assigned to personal organizations instead of invited organizations. See [docs/INVITATION_FIX.md](edeastorm/supabase/migrations/README_INVITATION_FIX.md) for details.

### ✅ Implemented: Comprehensive Activity Logging (2026-01-13)
Added enterprise-grade activity logging for security, compliance, and audit purposes. Tracks authentication, user management, invitations, and board access. See [docs/ACTIVITY_LOGGING.md](docs/ACTIVITY_LOGGING.md) for full documentation.

**Quick Start:**
```typescript
// Server-side logging
import { logAuthLogin, logInvitationSent } from '@/lib/activity';
await logAuthLogin(userId, 'google');

// Client-side logging
import { useActivityLogger } from '@/lib/activity';
const { logBoardAccess } = useActivityLogger();
await logBoardAccess(boardId);

// View activity logs
import { ActivityLogComponent } from '@/lib/activity';
<ActivityLogComponent organizationId={orgId} />
```

## TODO

v1.0

- Documentation - Let's create a footer with some sections like FAQ, documentation, let's add a developers link on footer and add some documentation around the API (mintlify, https://netgfxcom.mintlify.app/quickstart).
  We need to add some API endpoints to be able to:
- return a list of boards
  - get a specific board and its notes, images
  - post a new note on a board
  - export action items from a specific board API
- Link with stripe program, client-wiring, monthly, yearly plan
- Test invitation flows, add more providers (gitlab, discord).
  - Add providers on the signup form
  - Invitation should link to the signup form and handle case to wait for email validation before continuing
- Add version (on BE and UI, visible on settings)
- Secure free, vs monthly, and yearly and over/underpaid
- Privacy policy (according to nextauth and supabase, should be GDPR compliant), we should audit for certifications soc2, hipaa, etc.
- Legal (Terms of use)
- GDPR Compliance
- Support
  - FAQ
- Export options for board (pdf, png, svg)
- Verify routes and manual routes
- Verify security (injection, url manipulation, session, xxs)
  - Verify and tighten RLS
- Realtime collab not break down under pressure
- Canvas improvements
  - Performance
  - Smart save
  - Debounce
  - assign default notes colors to individuals (add default color as border ring around collab indicator, shared across all participants)
  - More draggable items: arrows, shapes (fill, stroke-only)
  - image upload limits (based on plan, up to 500mb for free, and max 3mb per image)
    - Track space consumption
  - Improve AI features
    - Limit AI interactions per plan (max 20 actions per month on free)
      - Track AI interactions usage
  - Make consolidated view for tracking usage limits and plan (add call to action button to upgrade)
- Admin plan cascades on shared boards (if the admin/creator of the board has pro plan, this cascades to the board and all participants admin/editor can use enhanced capabilities, these usages count on the board admin quota), the plan the board belongs to should be visible but subtly (top bar?)
- Make sure there are no ways for infinite usage on accounts, all actions under quota must be counted
- SSO support for enterprises
- Calculate costs and project prices for break-even and profit within 3 months
- Add unit tests (vitest) and e2e testing with playwright MCP, verify flows, regression tests

v2.0

- self-host option
- Marketing
- Startup funding
- Look into product hunt
- More A.I features around ideation and historic comments
- API options
- Better dashboard and QoL
- Fixes and cleanups from feedback
- Canvas enhancements
- TLDRAW support (?)
- Mermaid chart support (?)
- A.I chatbot helper
- Collaboration enhancements
