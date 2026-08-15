<!-- @format -->

# Edeastorm

An ideation platform

## ⚠️ URGENT: Migration Required

**Action Needed:** Apply migration `015_fix_invitation_race_condition.sql` to your Supabase database.

See **[URGENT_FIX_REQUIRED.md](URGENT_FIX_REQUIRED.md)** for step-by-step instructions.

**Without this migration, new users cannot sign up** (will get "Access Denied" error).

---

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

Each item below is an implementation prompt. Before starting one, read `AGENTS.md`, inspect the current code and migrations because some features are partially implemented, and research current official documentation or applicable standards rather than relying only on the older planning documents in this repository.

### v1.0

- **Documentation and site navigation:** Audit the existing marketing pages and documentation, then add a useful footer with FAQ, support, product documentation, legal, and developer/API links; research current documentation-platform options such as Mintlify, decide what should live in the repository versus an external docs site, and make navigation consistent across public pages.

- **Public board API:** Design and implement a versioned, authenticated API that can list accessible boards, retrieve one board with its notes and images, create a note, and export action items; first research current REST API conventions, API-key storage and scoping, pagination, rate limiting, validation, and OpenAPI documentation, then align every endpoint with the existing Supabase schema and RLS model.

- **Stripe billing:** Research the current official Stripe Billing and Next.js guidance, then implement secure monthly and yearly subscriptions with checkout, customer portal, webhook verification, subscription persistence, idempotency, and UI wiring; use server-side price identifiers and treat verified webhook state—not client redirects—as the billing source of truth.

- **Authentication providers and invitation signup:** Audit credentials, Google, GitHub, and the current organization invitation flow, add GitLab and Discord only after researching their current Auth.js provider requirements, expose the supported providers consistently in sign-in/signup, and ensure invited users preserve the token through signup, email verification, OAuth, and profile creation before joining the intended organization.

- **Application version:** Establish a single build/version source, expose it safely through the backend and settings UI, and research an appropriate semantic-version and release-metadata strategy so local, deployed, and support-visible versions can be correlated without manually updating several files.

- **Plan and subscription enforcement:** Define the authoritative states for free, monthly, yearly, trialing, canceled, unpaid, underpaid, and overpaid accounts, research Stripe’s current subscription/payment state model, and implement server-side entitlements and graceful UI states so access never depends only on hidden buttons or client-provided plan data.

- **Privacy policy and compliance scope:** Inventory the data handled by NextAuth, Supabase, Brevo, Flagsmith, Gemini, Stripe, logs, cookies, and browser storage, research current GDPR/privacy notice requirements and the actual SOC 2 or HIPAA capabilities of each vendor, then publish an accurate policy that avoids claiming certifications or protections the product has not independently achieved.

- **Terms of use:** Research the legal topics applicable to a collaborative SaaS product and draft routes for terms covering accounts, acceptable use, user content, AI output, payments, termination, warranties, and liability; clearly flag where qualified legal review is required and replace all placeholder legal links.

- **GDPR product controls:** Research current GDPR controller/processor obligations, then implement the product features behind the policy—consent and cookie handling where needed, data access/export, correction, account deletion, retention rules, invitation/log privacy, and a documented process for data-subject requests across every third-party processor.

- **Support and FAQ:** Research the questions and failure modes users are most likely to encounter, then create an accessible support/FAQ experience covering accounts, invitations, permissions, canvas collaboration, billing, AI, privacy, and troubleshooting, with a maintainable contact or ticket path and links from relevant error states.

- **Board export:** Research reliable browser/server rendering approaches and implement exports of a complete board to PDF, PNG, and SVG while preserving positions, dimensions, colors, images, text, and a sensible bounding box; address large canvases, external assets, fonts, transparent backgrounds, permissions, progress feedback, and filename sanitization.

- **Route and navigation audit:** Enumerate every App Router page, API route, redirect, callback, middleware rule, and UI link, research current Next.js routing and middleware conventions, then test authenticated, unauthenticated, expired, missing, and unauthorized cases; repair dead routes and placeholder links, document intentional public routes, and add automated coverage for the resulting route matrix.

- **Security and RLS hardening:** Perform a threat-model-driven audit of injection, XSS, URL/UUID manipulation, CSRF, session fixation, authorization bypass, uploads, invitation tokens, service-role fallbacks, Realtime channels, and data leakage; research current OWASP, Next.js, Auth.js, and Supabase guidance, replace temporary/debug policies, align API checks with RLS, and add regression tests for every fixed boundary.

- **Realtime collaboration load and resilience:** Define realistic concurrency and latency targets, research Supabase Realtime limits and Yjs synchronization behavior, then load-test item changes, cursors, presence, reconnects, offline edits, large notes, and simultaneous conflicts; fix leaks, stale presence, dropped updates, and recovery gaps while adding observable metrics and repeatable stress tests.

- **Canvas performance and smart saving:** Profile the board with large item counts and simultaneous updates, research current React, GSAP, Supabase, and collaborative-editor performance guidance, then implement measured improvements such as viewport-aware rendering, stable subscriptions, batching, debounced persistence, save-state feedback, retry/backoff, and reduced preview work while preserving drag accuracy, Yjs collaboration, optimistic locking, and failed-write recovery.

- **Participant note colors:** Design a deterministic per-participant color assignment that is shared across clients and remains readable in both themes, apply it to default note styling and the collaborator indicator ring, and research accessible contrast/color-blind-safe palettes before deciding how colors persist across sessions and organizations.

- **Shapes, arrows, and connectors:** Extend the canvas item model and interaction system with draggable/resizable filled and outline shapes plus arrows/connectors, researching established whiteboard interaction patterns for creation, selection, endpoints, snapping, layering, keyboard control, serialization, Realtime synchronization, previews, and export.

- **Image limits and storage metering:** Research Supabase Storage limits and safe upload validation, then enforce plan-aware per-file MIME/size rules and total account or organization quotas on the server, track usage transactionally across upload/delete/board deletion, prevent malicious SVG/path abuse, and show clear usage and failure feedback in the UI.

- **AI feature quality:** Audit all four Gemini flows end to end—including the currently incomplete enhancement request—then research current AI SDK structured-output/tool-calling patterns, make data access work with strict RLS, validate model responses, persist useful insights, improve empty/error states, and add deterministic tests around prompts and parsing without calling the live model by default.

- **AI usage limits:** Define what counts as an AI action and which owner/board/organization pays for it, then implement atomic monthly metering and plan limits such as 20 free actions; research provider token/cost reporting, prevent retries or concurrent requests from double-spending or bypassing quotas, and expose remaining usage before an operation starts.

- **Usage and plan dashboard:** Build one consolidated settings view for current plan, renewal/payment state, boards, collaborators, storage, AI usage, and other quotas, sourcing every value from server-authoritative metering; research effective SaaS usage UX and include contextual upgrade actions without hiding operational or billing errors.

- **Board-owner plan inheritance:** Specify and implement how a board inherits capabilities from its owner or organization plan, how shared admins/editors consume the owner’s quota, and what happens after ownership, plan, or organization changes; research comparable collaborative SaaS entitlement models and show the effective board tier subtly but unambiguously in the board UI.

- **Metering integrity:** Audit every quota-controlled creation, upload, AI call, invitation, retry, deletion, and background operation for bypasses, then centralize atomic authorization-and-consumption logic with idempotency and reconciliation; research abuse-resistant SaaS metering patterns and add concurrency tests proving usage cannot become unlimited through alternate routes or races.

- **Enterprise SSO:** Research current Auth.js and identity-provider support for OIDC and SAML, then design enterprise SSO with verified domains, organization discovery, enforced login policy, secure account linking, JIT provisioning, role mapping, recovery access, audit logs, and configuration documentation before selecting any additional vendor or library.

- **Unit economics and pricing:** Build a reproducible cost model using researched current prices for hosting, database/storage, Realtime, email, flags, AI tokens, payment fees, support, taxes, and expected usage, then propose plan limits and monthly/yearly prices that target break-even and profitability within three months while documenting assumptions and sensitivity ranges.

- **Automated test foundation:** Add Vitest for unit/component tests and Playwright for E2E tests after researching their current Next.js integration, establish fixtures and isolated test data, and cover authentication, invitations, permissions, organizations, board CRUD, canvas persistence, uploads, AI boundaries, billing webhooks, Realtime collaboration, and regressions without depending on production services.

- **Board deletion:** Audit the existing creator/admin deletion flow rather than rebuilding it blindly, research safe destructive-action and Supabase cleanup patterns, then verify authorization, confirmation UX, cascade behavior, Storage cleanup, activity logging, quota reclamation, Realtime teardown, idempotency, and tests for owners, organization admins, viewers, and concurrent deletion.

- **Folders and workspaces:** Research organization/folder information architecture in comparable collaboration tools, then design schema, RLS, navigation, move/reorder behavior, counts, permissions, and migration of existing boards so users can organize content without duplicating the existing organization concept.

- **Board-specific invitations:** Distinguish board collaborators from organization membership, research secure invitation and role-management patterns, then implement board invitations with viewer/contributor/editor/admin roles, expiration, acceptance, revocation, email delivery, existing/new user handling, and tests; align the UI, `check_board_access`, API authorization, and RLS so an invite grants only the intended board scope.

- **Organization management UI:** Expand the current selector/member page into a complete organization experience for creating, switching, renaming, configuring, leaving, and—if authorized—deleting organizations; research safe multi-tenant ownership-transfer rules and prevent orphaned boards, last-admin removal, or cross-organization leakage.

- **Tier indicators:** Research accessible SaaS plan-label conventions, then add a reusable tier badge near the logo and in profile/settings that reflects server-authoritative effective entitlements rather than a client flag, supports free/trial/paid/enterprise states, and remains subtle across responsive layouts and shared boards.

- **Profile picture updates:** Research secure avatar upload/cropping patterns, then implement authenticated profile-image replacement and removal using a dedicated Supabase Storage path, MIME/size validation, cache-busting, old-file cleanup, profile synchronization, and fallback behavior for OAuth-provided images.

- **Responsive and mobile UX:** Audit all public, auth, dashboard, member, profile, modal, and board screens at common touch breakpoints, research mobile whiteboard interaction conventions, then fix overflow, navigation, tables, safe areas, touch pan/zoom/select/edit gestures, dialogs, keyboard behavior, performance, and accessibility with device-oriented tests.

- **Stripe tiers and discount codes:** Model Stripe products/prices for all supported tiers and billing cycles, research current coupon, promotion-code, trial, and 100%-discount behavior, then implement secure eligibility, redemption, webhook reconciliation, invoice display, expiration, and abuse prevention without treating a free invoice as an untracked account.

- **Organization selection during board creation:** Research multi-workspace creation patterns, then improve the current selected-organization behavior by making the target organization explicit in the creation modal when a user has multiple memberships, showing role/permission context, validating the choice server-side, and preserving the dashboard selection after creation.

- **Board cloning:** Implement permission-aware cloning of board metadata, canvas items, and optionally images into a chosen organization/folder, researching efficient transaction and Storage-copy strategies; generate new IDs/short IDs, reset ownership/version/presence data, meter resulting storage, and provide rollback or cleanup on partial failure.

- **URL preview cards:** Research secure server-side URL metadata extraction, then let users paste a URL to create a preview card with normalized URL, title, description, and image; defend against SSRF, redirects, private networks, oversized content, malicious markup, timeouts, duplicate fetches, and stale thumbnails while supporting graceful fallback.

### v2.0

- **Self-hosting:** Research realistic self-hosted deployment targets and licensing implications, then separate hosted-only integrations from core services, provide containers/configuration for the app and required infrastructure, document secrets, migrations, storage, Realtime, email, AI, backups, upgrades, health checks, and the limitations of replacing managed vendors.

- **Marketing system:** Research the target audience, competitors, positioning, acquisition channels, and measurable funnel, then turn findings into maintainable landing pages, use-case content, analytics with appropriate consent, campaign attribution, SEO metadata, and an experimentation plan tied to activation and retention rather than vanity metrics.

- **Startup funding readiness:** Research suitable funding paths and current investor expectations for this product stage, then assemble a data-backed package covering market, differentiation, traction, roadmap, security/compliance posture, unit economics, use of funds, risks, and a reproducible demo without overstating unfinished features.

- **Product Hunt launch:** Research current Product Hunt launch guidance and comparable launches, then prepare positioning, media, maker profiles, onboarding, support coverage, analytics, feedback capture, and a launch-day/post-launch plan only after reliability, legal, billing, and core activation flows meet a documented readiness checklist.

- **Historical AI ideation:** Design AI features that can reason over prior board versions, comments, decisions, and outcomes with explicit user control, researching retrieval, embeddings, privacy, retention, provenance, evaluation, and cost; make generated claims traceable to source items and prevent cross-organization context leakage.

- **Expanded API platform:** Evolve the v1 API into a supported developer platform with scoped keys or OAuth, versioning, webhooks, idempotency, quotas, SDK/examples, changelog and deprecation policy, sandbox/test strategy, observability, and complete OpenAPI documentation based on researched current platform conventions.

- **Dashboard and quality-of-life improvements:** Use telemetry, support requests, usability testing, and researched collaboration-product patterns to identify the highest-friction dashboard workflows, then implement a focused set of improvements such as search, sorting, recents, favorites, bulk actions, better empty states, and keyboard navigation with measurable acceptance criteria.

- **Feedback-driven maintenance:** Research lightweight product-feedback and incident-triage practices, establish a process that converts user feedback and production signals into reproducible issues, severity, ownership, regression tests, and release notes, then fix the highest-impact reliability, accessibility, performance, and usability problems without allowing broad cleanup to obscure behavioral changes.

- **Advanced canvas capabilities:** Research mature whiteboard tools and prioritize enhancements such as multi-select, grouping, alignment, layers, undo/redo, copy/paste, templates, comments, voting, minimap, and presentation mode, implementing them incrementally against the existing persistence, permissions, Realtime, export, and accessibility model.

- **Tldraw evaluation:** Research the current Tldraw SDK, license, hosting model, collaboration architecture, extensibility, bundle impact, and migration constraints, then build a small isolated proof of concept and decision record comparing integration or replacement against the current canvas before committing to production adoption.

- **Mermaid diagrams:** Research Mermaid’s current rendering and security guidance, then prototype a diagram canvas item with source editing, sanitized rendering, error feedback, theming, resize/export support, Realtime synchronization, and strict controls preventing unsafe directives or external resource abuse.

- **AI assistant:** Design a board-aware conversational assistant that can answer, summarize, suggest, and perform explicitly confirmed actions, researching current AI SDK agent patterns, tool authorization, streaming, context limits, prompt injection, auditability, quotas, and evaluations; never let model output bypass the user’s board permissions or mutate data silently.

- **Collaboration enhancements:** Research the collaboration features users value most, then extend presence beyond cursors with reliable editing indicators, comments, mentions, notifications, follow mode, facilitation controls, conflict recovery, and session history while maintaining privacy, accessibility, performance, and predictable behavior under disconnects and high concurrency.
