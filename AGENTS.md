# Edeastorm workspace guide

This file is the operational source of truth for agents working anywhere in this repository. It describes the workspace as audited on 2026-07-30. Read it before changing code, database migrations, configuration, or documentation.

## First principles

- The production application is `edeastorm/`, not the repository root and not `canvas-framework/`.
- Run application commands from `edeastorm/`.
- Treat `canvas-framework/` as a legacy prototype/reference unless a task explicitly targets it.
- Prefer current code, `package.json`, and ordered SQL migrations over claims in planning documents. Several documents describe planned or partially wired features as complete.
- Preserve local `.env` and `.env.local` files. Never print, copy, commit, or replace their values.
- Do not run database scripts or migrations merely to test the app. They can mutate a remote Supabase database.
- A user-facing permission check is not a security boundary. Keep authorization in API routes and/or Supabase RLS.

## Repository map

```text
/
├── edeastorm/                 # Active Next.js application
│   ├── src/app/               # App Router pages and API route handlers
│   ├── src/components/        # Canvas, dashboard, activity, provider, and UI components
│   ├── src/contexts/          # Dashboard organization/board state
│   ├── src/hooks/             # Permission, activity, and realtime worker hooks
│   ├── src/lib/               # Auth, Supabase, data API, AI, email, permissions, utilities
│   ├── src/store/             # Zustand stores
│   ├── src/types/             # Supabase-generated and application types
│   ├── src/workers/           # Browser Web Worker for Supabase Realtime
│   ├── src/emails/            # React Email invitation template
│   ├── supabase/migrations/   # Ordered database schema and RLS migrations
│   ├── scripts/               # Direct database diagnostics/mutation scripts
│   ├── cypress/e2e/           # Minimal browser test coverage
│   ├── AI-Documentation/      # Feature notes; useful but sometimes ahead of code
│   └── public/                # Logo, favicons, and static assets
├── canvas-framework/          # Legacy Create React App canvas prototype
├── docs/                      # Security/activity implementation and audit notes
├── README.md                  # Status notes and broad backlog, not setup documentation
├── IMPLEMENTATION_PLAN_V1.0.md# Roadmap/aspirational implementation plan
├── plan.md                    # Original blueprint
└── image (62-64).png          # Root-level design/reference images
```

There is no root package manager workspace. `edeastorm/` and `canvas-framework/` have independent `package.json` files.

## Active application stack

- Next.js 16.1.1 App Router with React 19.2 and TypeScript 5 in strict mode.
- Tailwind CSS 4 through `@tailwindcss/postcss`; global design tokens and custom classes live in `src/app/globals.css`.
- NextAuth/Auth.js 5 beta with JWT sessions and Google, GitHub, and credentials providers.
- Supabase for Auth identities, Postgres, RLS, Storage, and Realtime.
- Zustand 5 for client state.
- GSAP Draggable for canvas pan, drag, and resize interactions.
- Tiptap 3 + Yjs + IndexedDB + Supabase broadcast for collaborative sticky-note text.
- Vercel AI SDK 6 with Google Gemini `gemini-2.5-flash`.
- Flagsmith for the `pricing_view` feature flag.
- React Email rendering and the Brevo HTTP API for invitation mail.
- Cypress 13 for the only checked-in E2E test.

The lockfile is npm’s `edeastorm/package-lock.json`. Use npm unless the user explicitly requests a package-manager change.

## Setup and commands

Use a current Node 20+ environment.

```bash
cd edeastorm
npm ci
npm run dev
```

The development server uses `http://localhost:3000`.

Available package scripts:

```bash
npm run dev       # Next development server
npm run build     # Production build
npm run start     # Serve a completed production build
npm run lint      # ESLint over the whole edeastorm directory
```

There is no `test`, typecheck, migration, or Cypress script in the active package. Use these explicitly when relevant:

```bash
npx tsc --noEmit
npx cypress run
npx cypress open
```

Cypress expects an already running app at `http://localhost:3000`; its config does not launch one.

For the legacy prototype only:

```bash
cd canvas-framework
npm install
npm start
npm test
npm run build
```

`canvas-framework/` has no lockfile, uses React 18/react-scripts 5, and is not part of the active app build.

## Environment configuration

Copy `edeastorm/env.example.txt` to `edeastorm/.env.local`, but note that the example is incomplete. Never expose server-only values through a `NEXT_PUBLIC_` name.

Core application variables:

| Variable | Purpose |
| --- | --- |
| `NEXTAUTH_URL` | Canonical Auth.js URL and invitation-link base URL |
| `NEXTAUTH_SECRET` | Auth.js JWT/session secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/server Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only RLS-bypassing client |
| `SUPABASE_JWT_SECRET` | Signs a Supabase-compatible JWT into the NextAuth session so RLS sees `auth.uid()` |

Authentication providers:

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth |

Optional feature integrations:

| Variable | Purpose |
| --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Enables the four Gemini routes |
| `BREVO_API_KEY` | Sends organization invitation emails |
| `FLAG_SMITH_SDK_KEY` | Flagsmith environment ID; currently gates pricing |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Used only if rate-limit helpers are wired into routes |
| `DATABASE_URL` | Direct Postgres connection for scripts in `scripts/` |

`NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_APP_NAME` appear in the example but are not currently consumed by application code. Some local files contain legacy names such as `GITHUB_ID`, `GITHUB_SECRET`, and `BREVO_SMTP`; the application does not read those names.

Important configuration details:

- Missing Supabase URL or anon key throws during module initialization in `src/lib/supabase.ts`.
- Missing `SUPABASE_JWT_SECRET` silently omits `session.supabaseAccessToken`. Some server routes then fall back to the service-role client after doing application-level permission checks.
- `next.config.ts` contains a hard-coded Supabase hostname in `images.remotePatterns`. Update it if the project changes.
- Google fonts are fetched by `next/font` during builds, so offline/restricted builds can fail.
- The CSP intentionally still permits `'unsafe-inline'` and `'unsafe-eval'`; do not describe it as a strict CSP.

## Routes and user-facing functionality

### Pages

| Route | Current behavior |
| --- | --- |
| `/` | Server-rendered marketing page; CTA changes with session |
| `/pricing` | Flagsmith-gated static pricing UI; no checkout or subscription backend |
| `/auth/signin` | Credentials, Google, and GitHub sign-in |
| `/auth/signup` | Supabase email/password signup and email confirmation |
| `/auth/forgot-password` | Supabase password-recovery email |
| `/auth/reset-password` | Supabase password update |
| `/auth/error` | Auth error/retry handling |
| `/dashboard` | Organization selector, board list/previews, create/delete board |
| `/dashboard/members` | List, invite, remove, and change organization member roles |
| `/dashboard/profile` | Account display, organization rename, and mock billing receipts |
| `/board/[shortId]` | Collaborative canvas |
| `/invite/accept?token=...` | Validates and presents an invitation |
| `/invite/complete?token=...` | Completes acceptance after sign-in |

Middleware protects `/dashboard...` and redirects signed-in users away from sign-in/signup pages. `/board/[shortId]` and invitation pages are not middleware-protected. Every sensitive API route must authenticate and authorize itself.

Links to `/terms` and `/privacy` exist, but those routes do not exist. Signup uses placeholder `#` legal links.

### API routes

| Method and route | Purpose and access |
| --- | --- |
| `GET/POST /api/auth/[...nextauth]` | Auth.js handlers |
| `GET /api/auth/confirm` | Verify Supabase email/recovery OTP and redirect |
| `POST /api/boards` | Create a board after membership check |
| `DELETE /api/boards` | Delete if creator or organization admin |
| `POST /api/board-images/upload` | Upload image and metadata; currently creator-only |
| `POST /api/rooms/join` | Add/reactivate authenticated room presence |
| `GET /api/rooms/users?boardId=` | Fetch active presence rows |
| `GET /api/invitations/[token]` | Public invitation metadata lookup |
| `POST /api/invitations/[token]/accept` | Accept matching-email invitation |
| `POST /api/organizations/[orgId]/invite` | Existing user add or new-user invitation |
| `POST /api/ai/cluster` | AI clustering; editor/admin according to access RPC |
| `POST /api/ai/enhance` | AI enhancement; requires `boardId`, `itemId`, and `content` |
| `POST /api/ai/summarize` | AI session summary |
| `POST /api/ai/sentiment` | AI engagement/sentiment analysis |
| `POST /api/activity/log` | Authenticated client activity insert through server logger |
| `GET /api/activity` | Filtered activity-log retrieval |

There is no REST `GET /api/boards`, board-detail API, public API-key system, Stripe API, or export API. Most reads and canvas writes use the Supabase browser client in `src/lib/api.ts`.

## Core flows

### Authentication and identity bridge

There are two related identity systems:

1. NextAuth owns the application session.
2. Supabase Auth owns user UUIDs referenced by `profiles.id` and database foreign keys.

OAuth sign-in in `src/lib/auth.ts`:

1. Auth.js authenticates with Google or GitHub.
2. The sign-in callback lists Supabase Auth users by email and creates one if absent.
3. `user.id` is changed to the Supabase Auth UUID.
4. A `profiles` row is created if absent.
5. The database profile trigger assigns an invited organization or creates a personal organization.
6. JWT/session callbacks load profile role/organization and optionally sign a Supabase-compatible JWT.

Credentials sign-in calls `supabase.auth.signInWithPassword()` inside the Auth.js credentials provider, then follows the same NextAuth callbacks.

Email signup is different: the browser calls `supabase.auth.signUp()`, confirms through `/api/auth/confirm`, and then the user signs into NextAuth with credentials.

Do not create a second profile ID or use an Auth.js-generated ID. `profiles.id`, `organization_members.user_id`, `boards.created_by`, and the session user ID must all be the Supabase Auth UUID.

### Organization and invitation flow

- Migration `015_fix_invitation_race_condition.sql` is intended to make the profile trigger check unexpired invitations before creating a personal organization.
- Existing invitee: the invite endpoint directly inserts `organization_members`.
- New invitee: it stores a seven-day invitation and sends a Brevo email.
- The accept page fetches invitation metadata, requires the signed-in email to match, then calls the accept route.
- The accept route creates a missing profile if necessary, inserts membership if the trigger did not, updates the profile’s primary organization, deletes the invitation, and logs acceptance.
- Email delivery failure does not roll back the database invitation; the route still returns success with `emailSent: false`.

Organization roles are `admin`, `editor`, and `viewer`. Frontend permissions in `src/lib/constants.ts` currently mean:

| Capability | Admin | Editor | Viewer |
| --- | --- | --- | --- |
| View boards/team | Yes | Yes | Yes |
| Create board | Yes | Yes | No |
| Rename organization | Yes | No | No |
| Manage team | Yes | No | No |
| Delete any board | Yes | No | No |

The invite API allows both admin and editor to invite, which is broader than the UI’s `canManageTeam` behavior. Database policies may impose a different rule again. When changing roles, align UI, API, `check_board_access`, and RLS together.

### Board and canvas flow

1. Dashboard state in `DashboardContext` loads the user’s `organization_members` rows.
2. Selecting an organization loads its boards and members.
3. Creating a board goes through `POST /api/boards`; the server generates a Nano ID short ID.
4. Board cards fetch all canvas items and generate an in-browser SVG preview.
5. The board page loads board, items, images, role, and room users.
6. `InfiniteCanvas` manages a fixed 10,000 × 10,000 surface with pan and zoom from 0.25× to 2×.
7. `Toolbar` exposes select/pan, sticky note, header, image, AI, save snapshot, theme, and related controls.
8. Canvas item rows persist type, x/y, z-index, JSON metadata, creator, and version.

Implemented item renderers are sticky notes, headers, and images. Database/type constants also mention shapes and connectors, but there is no complete creation/rendering flow for them.

The central problem statement is rendered as `ProblemCard`. Sticky notes support color, editing, dragging, deletion, and resize. Headers support H1/H2/H3 sizing. Images can be uploaded to the public `board-images` bucket and represented both in the gallery and as canvas items.

Only the final drag position uses optimistic locking. Other updates normally use last-write-wins direct updates.

### Realtime, presence, and collaborative text

There are three separate realtime paths:

- `src/workers/realtime.worker.ts` subscribes to `canvas_items` and `room_users` Postgres changes and broadcasts cursors on `board:{boardId}`.
- `room_users` rows persist active presence and coarse cursor/last-seen data.
- Each sticky note creates a Yjs document named by canvas item ID. `SupabaseProvider` broadcasts Yjs updates on `yjs:{documentId}`, while `y-indexeddb` persists the CRDT state locally.

The durable sticky-note fallback remains `canvas_items.metadata.title` HTML. Yjs broadcast messages themselves are ephemeral. A new client can request a full Yjs state only from another connected client or recover its own IndexedDB copy.

On board teardown, the worker is unsubscribed and the Zustand node store is cleared. The current board flow does not reliably call `leaveRoom`, so stale rows depend on later reactivation/cleanup.

### AI flow

- The UI modal offers cluster, enhance, summarize, and sentiment.
- Route handlers authenticate, check the Gemini key, call `check_board_access`, and require returned role `editor` or `admin`.
- `src/lib/ai-services.ts` uses AI SDK tools to fetch board details/items/images and logs usage in `ai_processing_logs`.
- Outputs are parsed as JSON and shown in the modal; results do not reorganize the canvas automatically.
- The `ai_insights` persistence tool exists but the four primary functions do not consistently call it.

Enhancement is currently mismatched: the modal sends only `boardId`, while `/api/ai/enhance` requires `itemId` and `content`. It will return HTTP 400 until the UI selects a note and sends those fields.

### Activity logging

The server logger writes through `supabaseAdmin()` and intentionally swallows logging failures. Auth and invitation flows call a subset of the convenience loggers.

`ActivityProvider`, `ActivityLog`, the activity hook, queue, and viewer exist but are not mounted in the root layout or dashboard. Do not assume automatic session/page tracking or a visible audit-log page is live. Board create/update/delete/access logging is also not comprehensively wired.

## Client state ownership

- `DashboardContext`: selected organization, organization boards/members, dashboard loading, and dashboard actions.
- `useNodeStore`: canvas items, selected item, editable item, and local drag marker.
- `useEditorStore`: scale, pan, active tool, UI state, cursor, loading/saving, and theme.
- `useGlobalStore`: presence users, current room, anonymous username, and last persistence update. Only username is persisted.
- `useActivityStore`: activity viewer state, client log queue, and session timestamps; currently mostly dormant.

Keep server/database entities in Supabase and ephemeral interaction state in Zustand. Do not add duplicate React state when a store/context already owns the value.

## Database and migrations

The schema is built by ordered files `001` through `015` in `edeastorm/supabase/migrations/`.

Principal tables:

- Tenancy/users: `organizations`, `profiles`, `organization_members`, `organization_invitations`.
- Legacy team model still in schema: `teams`, `team_members`.
- Boards: `boards`, `board_collaborators`, `canvas_items`, `board_images`, `board_snapshots`.
- Presence/audit: `room_users`, `activity_log`.
- AI: `ai_insights`, `ai_processing_logs`, `ai_feedback`.

Key functions/triggers:

- `handle_new_user()` creates a profile from a new Supabase Auth user.
- `handle_new_profile_organization()` handles invitation-aware organization assignment.
- `check_board_access()` centralizes public/creator/collaborator/profile-organization/team access.
- `update_canvas_item_with_version()` provides optimistic locking.
- updated-at and canvas version triggers maintain timestamps/versions.
- Realtime publication includes core live tables; storage migrations create public asset/image buckets.

Migration rules:

- Add a new numbered migration; do not rewrite already deployed migrations unless the user explicitly requests history repair.
- Update `src/types/database.ts` after schema changes using Supabase type generation.
- `src/types/database.ts` is currently UTF-16 LE. ESLint treats it as binary. Convert it deliberately to UTF-8 before expecting normal lint/tool behavior.
- There is no checked-in `supabase/config.toml`, so CLI commands require external Supabase login/link configuration.
- `scripts/migrate.js` is not a safe migration ledger: it runs every SQL file, catches individual failures, and continues.
- `012_debug_hardcoded.sql` creates a temporary policy for a hard-coded user, and later migrations do not explicitly remove it. Do not deploy it to a new environment; audit/remove `debug_me` in existing environments.
- `015` is called out as mandatory by the README. Verify actual remote migration state rather than assuming file presence means deployment.
- Migrations `003`, `007`, `009`–`014` contain superseded or overlapping RLS policies. The final effective policy set depends on which scripts were actually run.

Never run these without explicit authorization and a confirmed target:

- `scripts/migrate.js`
- `scripts/run_sql.js`
- `scripts/fix_rls_for_nextauth.js`
- `scripts/secure_writes.js`
- `scripts/simplify_rls.js`
- `add-fkey-migration.js`

Even “debug” scripts connect to `DATABASE_URL`, and several contain hard-coded historical user/project identifiers.

## Security and authorization caveats

These are current code facts, not completed remediation:

- The browser Supabase singleton normally uses the anon key and is not automatically given `session.supabaseAccessToken`. Many reads/writes in `src/lib/api.ts` therefore depend on a separate browser Supabase Auth session or permissive RLS.
- Properly tightened RLS can expose gaps in dashboard/canvas operations that currently work only because some API routes fall back to service role or a database has older policies.
- `POST /api/boards` verifies membership but not the member role, so a viewer can bypass the UI and create a board.
- Room join/list routes do not perform an explicit board-access check. If `SUPABASE_JWT_SECRET` is missing they use the service-role fallback, allowing any signed-in user to target a known board UUID.
- `check_board_access()` predates `organization_members`. It checks `profiles.organization_id` and returns `contributor` for organization access. AI routes require `editor`/`admin`, so organization editors can be denied unless they are creator or board collaborator.
- AI service tools use the shared anon Supabase client on the server, not the authenticated/admin client already used for route access checks. Strict RLS can block the AI’s own data reads and processing-log writes.
- The public-board UI includes anonymous username/presence handling, but board/canvas RLS policies are scoped to `authenticated`; anonymous access is not a reliable supported flow.
- Board routes are not protected by middleware. RLS and per-operation authorization must remain correct.
- Image upload validation is mostly client-side. The upload route does not currently enforce MIME allowlists or size limits and allows only the board creator, not organization editors/admins.
- Invitation tokens use `Math.random()` plus a timestamp rather than a cryptographically secure token generator.
- `lib/rate-limit.ts` and `middleware/validation.ts` exist but are not imported by any live route.
- Most live JSON routes perform presence checks only, not the available UUID/length/enum sanitization. The client activity endpoint also accepts arbitrary action/entity strings from any authenticated user.
- `next.config.ts` security headers exist, but CSP permits inline/eval scripts and has no reporting endpoint or HSTS header.
- Activity fetches allow any organization member, not just admins, after membership verification.
- Storage buckets for board images/assets are public by design; do not put sensitive content there without changing the model.
- Never trust role checks in `BoardPage`; its role defaults to editor while data loads. Server/RLS checks must decide access.
- OAuth sign-in calls `supabase.auth.admin.listUsers()` and scans by email on every login. This is not a scalable lookup strategy.
- Auth provisioning errors are caught and sign-in is allowed to continue, so downstream code must handle sessions whose profile/organization setup is incomplete.
- Sticky-note editor updates are not actually debounced despite the comment in `StickyNote.tsx`; each Tiptap update can trigger a full metadata write in addition to Yjs broadcast traffic.

When changing access control, test at minimum: unauthenticated, unrelated authenticated user, viewer, editor, organization admin, board creator, board collaborator, invited new user, and invited existing user.

## Current incomplete or placeholder features

- Pricing is display-only and feature-flagged. No Stripe package, schema, webhook, quota, checkout, or billing portal exists.
- Profile receipts are hard-coded mock data and download buttons do nothing.
- Plan limits shown on pricing are not enforced.
- Activity UI/provider are not mounted.
- Board snapshots can be created, but there is no snapshot list/restore UI.
- “Share” copies a link; there is no board-specific collaborator UI.
- Public/anonymous boards are not consistently supported by current RLS/API behavior.
- Enhancement AI request wiring is incomplete.
- Shapes, connectors, folders/workspaces beyond organizations, clone, URL preview crawling, export, mobile polish, SSO, legal pages, and public developer APIs remain backlog items.
- Flagsmith is initialized globally, but only `pricing_view` is consumed.
- `@auth/supabase-adapter`, Nodemailer, and the legacy SDK packages are installed but not part of the active auth/email path.

## Testing and validation

Before handing off a normal code change, run the smallest relevant checks, then preferably:

```bash
cd edeastorm
npm run lint
npx tsc --noEmit
npm run build
```

For UI/auth changes, start the dev server and run:

```bash
npx cypress run
```

Current audit baseline (2026-07-30):

- `npm run lint` fails with 143 findings: 74 errors and 69 warnings.
- Failures include CommonJS database scripts being linted, React 19 hook/compiler rules, `@ts-nocheck`/`@ts-ignore`, unused code, and UTF-16 `src/types/database.ts` being parsed as binary.
- The only Cypress spec, `cypress/e2e/auth.cy.ts`, expects old sign-in copy (`Sign in to Edeastorm`, `Sign in with Google/GitHub`) while the current UI says `Welcome back` and labels provider buttons `Google`/`GitHub`.
- The checked-out `node_modules` is stale. `npm ls --depth=0` reports missing declared dependencies including React Email, Tiptap/Yjs, jsonwebtoken, Upstash, and others.
- `npm run build` fails in this checkout because of those missing installed dependencies and because Google fonts cannot be downloaded in the restricted environment. Run `npm ci` before judging package resolution.
- No unit or integration tests cover permissions, invitations, canvas persistence, realtime collaboration, AI, uploads, or migrations.

Do not “fix” unrelated baseline findings in a scoped change. Report whether a failure predates the change. If touching an already failing file, avoid adding new findings and fix nearby issues only when it stays within scope.

Recommended manual smoke flow for broad changes:

1. Sign up and confirm email, then sign in with credentials.
2. Sign in with one OAuth provider and confirm the same Supabase profile identity is used.
3. Switch organizations and verify role-sensitive dashboard controls.
4. Create, open, preview, and delete a board.
5. In two browsers, add/move/edit/delete notes and verify cursor/item/text synchronization.
6. Upload and remove an image.
7. Invite an existing user and a brand-new email; verify role, primary org, and invitation cleanup.
8. Verify viewer cannot mutate and unrelated users cannot read private board data.
9. Run each AI feature only after fixing/providing its required payload and verify usage logging.

## Code conventions

- Use the `@/*` alias for imports from `edeastorm/src`.
- Components and component files use PascalCase; hooks start with `use`; stores end in `Store`.
- App Router pages/routes stay under `src/app`; route handlers use `NextRequest`/`NextResponse`.
- Client components declare `"use client"` at the top. Keep server-only secrets and `supabaseAdmin()` out of client modules.
- Prefer generated `Tables`, `TablesInsert`, and `TablesUpdate` types from `src/types/database.ts`. Some existing code incorrectly imports `InsertTables`/`UpdateTables` under `@ts-nocheck`; do not copy that pattern.
- Canvas item-specific metadata belongs in `CanvasItemMetadata`; update its typing when adding item capabilities.
- Use the shared primitives under `src/components/ui` and `cn()` from `src/lib/utils`.
- Use existing permission constants/helpers rather than scattering new role string comparisons, but enforce the same rule server-side.
- Sanitize any rendered user HTML. Sticky notes store HTML; headers already use `sanitize-html`.
- Keep realtime callbacks stable and always unsubscribe/terminate workers/channels/providers in cleanup.
- For concurrent item changes, preserve the `version` column and optimistic-lock RPC. Do not blindly remove conflict handling.
- Database writes that require service role belong in authenticated server routes, followed by explicit authorization before the admin client is used.
- Do not add more `@ts-nocheck`, `@ts-ignore`, hard-coded UUIDs, project URLs, or credentials.
- The codebase contains mojibake in comments/UI strings. New text must be valid UTF-8; fix corrupted text only when in scope.

## Change-specific checklists

### Canvas or realtime changes

- Test pan/zoom coordinates at non-1 scale.
- Test note/header/image selection, editing, resize, delete, and drag.
- Test viewer/read-only behavior.
- Test two clients changing the same and different items.
- Ensure local drag is not overwritten by incoming Postgres changes.
- Verify Yjs state, persisted HTML fallback, worker cleanup, and channel cleanup.

### Auth, organization, or invitation changes

- Preserve Supabase Auth UUID identity.
- Test credentials and OAuth separately.
- Test existing/new invitee, wrong signed-in email, expired token, duplicate invite, and retry.
- Align profile primary organization, membership role, session claims, API checks, and RLS.
- Do not let email/logging failure corrupt the main transaction.

### API/security changes

- Validate type, length, UUIDs, enum roles, and request size.
- Authenticate before reading sensitive input where appropriate.
- Authorize the target resource, not just the organization supplied by the client.
- Add rate limits for expensive/auth/upload endpoints if the task covers hardening.
- Avoid returning raw provider/database error details in production responses.

### Database changes

- Add an ordered migration and make repeat behavior deliberate.
- Include RLS, indexes, grants, triggers, realtime publication, and storage policies as applicable.
- Regenerate database types in UTF-8.
- Test both an authenticated JWT client and service-role path.
- Document manual deployment/rollback implications.

## Legacy `canvas-framework/`

This directory is the earlier standalone canvas implementation:

- Create React App, React 18, Zustand, GSAP, Material UI, and Supabase.
- It uses legacy tables such as `rooms`, `room_users`, and `room_entities`, not the active app’s `boards`/`canvas_items` model.
- `src/App.tsx` hard-codes a room short ID.
- `src/helpers/constants.ts` contains a hard-coded historical Supabase URL and key. Do not reuse or copy them.
- It has its own canvas, context menu, username, room provider, presence, and CRUD helpers.
- It is useful as behavioral reference for older drag/presence code, but changes there do not affect `edeastorm/`.

Do not migrate prototype code wholesale. Port only the needed behavior and adapt it to current types, authorization, state stores, and schema.

## Documentation reliability

Useful references:

- `edeastorm/AI-Documentation/` for AI, concurrency, collaboration, and invitations.
- `docs/ACTIVITY_LOGGING.md` for intended logging API.
- `docs/SECURITY_AUDIT.md` for a checklist.
- `edeastorm/supabase/migrations/README_*.md` for manual migration context.

Known documentation drift:

- Security docs claim every route is validated/rate-limited; live routes do not import those helpers.
- Security docs list GitLab/Discord, Stripe, strict upload limits, and production compliance that are not implemented.
- Activity docs describe mounted automatic tracking and a visible viewer that are not wired into page layout.
- AI docs describe enhancement and persisted insights more completely than current UI/function calls.
- The README’s activity import examples use paths/exports that should be checked against current code before copying.
- Planning and startup documents are roadmaps, not evidence of shipped behavior.

When behavior changes, update this file and the narrowest relevant documentation. Do not mark a feature complete based only on scaffolding.
