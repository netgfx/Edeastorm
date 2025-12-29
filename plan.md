Here is the comprehensive blueprint and execution plan for the **Real-time Ideation App**. This document is designed to be fed into an LLM agent or followed by a development team to build the application from scratch.

### **Project Blueprint: "IdeaFlow" Collaborative Canvas**

#### **1. Project Overview**

A real-time, collaborative whiteboarding application designed for organizations. It features an infinite, zoomable canvas where teams can solve specific problems using sticky notes, images, and pre-defined headers.

* **Core Logic**: Authenticated users join a room via URL. The board syncs in real-time.
* **Key Constraint**: Only original editors/admins can modify the board structure; others contribute content.
* **Performance**: Uses Web Workers for WebSocket management to keep the UI thread unblocked.

#### **2. Tech Stack & Architecture**

* **Framework**: Next.js (App Router preferred for modern features).
* **Authentication**: NextAuth.js (Google Provider) integrated with Supabase RLS.
* **Database & Realtime**: Supabase (PostgreSQL + Realtime Channels).
* **State Management**: Zustand (Client state) + TanStack Query (Server state).
* **UI Library**: Shadcn UI (Radix Primitives + Tailwind CSS).
* **Animation/Interaction**: GSAP (GreenSock) for high-performance Draggable, Scale, and Tweening.
* **Testing**: Cypress (End-to-End & Component Testing).
* **Deployment**: Vercel.

---

### **3. System Architecture Guidelines**

**A. Hybrid Real-time Sync Strategy**
Adopt the "Hybrid Real-time Sync" model:

* **Persistent State (Postgres)**: Board metadata, Note content (`x`, `y`, `text`, `color`), Image URLs. Handled via Supabase Postgres Changes.
* **Ephemeral State (Broadcast)**: User cursors, presence, and live selection highlights. Handled via Supabase Broadcast to avoid DB bloat.

**B. The "DOME" Canvas & Web Worker**

* **Canvas**: Unlike the reference which used a simplified pan, this canvas must support **Zoom**. Implement a container hierarchy: `Viewport (Overflow Hidden)` -> `World (Transform: Scale)` -> `Draggable Surface`.
* **Worker Offloading**: Move the Supabase Realtime subscription logic into a dedicated Web Worker. The Worker handles the heartbeat and parses incoming JSON messages, sending only relevant "state updates" to the main thread via `postMessage`.

**C. Security & Permissions**

* **Organization-Lock**: NextAuth must validate the email domain against the Organization's allowlist.
* **Role-Based Access**:
* *Viewer*: Read-only.
* *Contributor*: Can add/edit their own notes.
* *Editor/Admin*: Can move/delete any item and save board snapshots.



---

### **4. Execution Checklist & Milestones**

#### **Phase 1: Environment & Authentication**

* [x] **Init**: Initialize Next.js project with TypeScript and Tailwind CSS. ✅ (Created `ideaflow` project with Next.js 15, TypeScript, Tailwind)
* [x] **Env Setup**: Create `.env` file with `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (for admin tasks), and `SUPABASE_ANON_KEY`. ✅ (Created `env.example.txt` template)
* [x] **Database Schema**: ✅ (Created SQL migrations in `supabase/migrations/`)
  * Create `profiles` table (linked to Auth users). ✅
  * Create `teams` and `boards` tables. ✅
  * Create `canvas_items` table (JSONB for generic item data like x, y, type, content). ✅
  * *Constraint*: Ensure RLS policies only allow reads/writes based on team membership. ✅ (Created `003_rls_policies.sql`)


* [x] **Auth Implementation**: Set up NextAuth with Google Provider. Create a custom sign-in page using Shadcn cards. ✅ (Created `src/lib/auth.ts`, `src/app/auth/signin/page.tsx`)
* [x] **Middleware**: Protect `/dashboard/*` routes to ensure only logged-in users can access. ✅ (Created `src/middleware.ts`)
* [ ] **Milestone Test (Cypress)**: Write a test that attempts to access a protected route, asserts redirection to login, mocks a login, and asserts access is granted.

#### **Phase 2: The Infinite Canvas (Core UI)**

* [x] **Layout**: Create the main Board Layout with Toolbar, Header, and canvas area. ✅ (Created `src/app/board/[shortId]/page.tsx`)
* [x] **Zustand Store**: Create stores to hold `zoomLevel`, `panPosition`, and `items` array. ✅ (Created `src/store/editorStore.ts`, `src/store/nodeStore.ts`, `src/store/globalStore.ts`)
* [x] **GSAP Draggable**: Implement the "DOME-based Canvas" logic. ✅ (Created `src/components/canvas/InfiniteCanvas.tsx`)
  * Create a `wrapperContainer` (viewport). ✅
  * Apply `Draggable.create` to the inner content layer. ✅


* [x] **Zoom Logic**: Add a `wheel` event listener to the wrapper. Use GSAP to animate the `scale` of the inner layer. ✅ (Implemented in `InfiniteCanvas.tsx`)
* [x] **Toolbar**: Implement a floating toolbar (Mid-Left) for tools: "Select", "Pan", "Note", "Image". ✅ (Created `src/components/canvas/Toolbar.tsx`)

#### **Phase 3: Real-time Worker Infrastructure**

* [ ] **Worker Setup**: Create `realtime.worker.ts`. Initialize the Supabase client *inside* the worker. (Deferred - using main thread for now)
* [x] **Bridge**: Create realtime subscription hooks. ✅ (Implemented in `src/lib/api.ts` with `subscribeToBoard` and `subscribeToBroadcast`)
* [x] **Cursor Tracking**: ✅ (Implemented in board page and `CursorLayer.tsx`)
  * Capture `mousemove` on the Main Thread. ✅
  * Throttle usage to 50ms. ✅ (Using throttle utility)
  * Broadcast to Supabase Realtime. ✅


* [x] **Incoming Stream**: Broadcast messages update the `useGlobalStore` with user positions. ✅ (Implemented in `src/app/board/[shortId]/page.tsx`)
* [ ] **Milestone Test (Cypress)**: Mock the Worker and verify state updates. (Testing deferred)

#### **Phase 4: Canvas Interaction (Items)**

* [x] **Note Component**: ✅ (Created `src/components/canvas/StickyNote.tsx`)
  * Port `StickyNote` logic: `x`, `y`, `content`, `color`. ✅
  * Use `react-contenteditable` for inline text editing. ✅
  * Owner-based permissions can be added (RLS enforces at DB level). ✅


* [x] **Drag & Drop**: ✅ (Created `src/components/canvas/NodeController.tsx`)
  * Make notes draggable using GSAP. ✅
  * Drag coordinates work with canvas scale. ✅


* [ ] **Pre-defined Titles**: Create drag-and-drop templates for "Problems", "Ideas", "Questions". (Future enhancement)
* [ ] **Image Support**: Implement a drop zone on the canvas. (Future enhancement - storage buckets configured in SQL)

#### **Phase 5: Dashboard & Team Management**

* [x] **Dashboard UI**: Create a "Team Dashboard" listing saved boards. ✅ (Created `src/app/dashboard/page.tsx`)
* [x] **Create Flow**: "New Board" modal -> Asks for Problem Statement -> Redirects to `/board/[shortId]`. ✅ (Implemented in dashboard)
* [x] **Snapshotting**: Implement a mechanism to save the current board state as a snapshot. ✅ (Created `createSnapshot` in API and save button in Toolbar)

#### **Phase 6: Optimization & Polishing**

* [x] **Coordinate Mapping**: Cursor position mapping accounts for zoom and pan. ✅ (Implemented in `InfiniteCanvas.tsx`)
* [ ] **Cleanup**: Implement `sortNotes` algorithm to align overlapping notes if triggered. (Future enhancement)
* [x] **Visual Feedback**: Added hover effects, selection borders, and drag shadows. ✅ (Implemented in `StickyNote.tsx`)

---

### **5. Testing Strategy (Cypress)**

**Unit/Integration Testing (via Cypress Component Testing):**

* **Test 1: Zoom Math**: Mount the `Canvas` component. Programmatically trigger a scroll event. Assert the `scale` transform style is updated correctly.
* **Test 2: Note Editing**: Mount a `StickyNote`. Simulate a double-click. Assert `contenteditable` becomes active. Type text. Assert `onChange` handler is fired.
* **Test 3: Access Control**: Mount a `StickyNote` with a mocked `author_id` different from the current user. Assert the "Delete" button is not rendered (or disabled).

**E2E Testing:**

* **Test 1: Multiplayer Sync**:
1. Open Browser A (Admin) and create a board.
2. Open Browser B (User) and join the URL.
3. Browser A moves a note.
4. Browser B asserts the note has moved to the new coordinates.


* **Test 2: Asset Upload**:
1. Drag a dummy image file onto the canvas.
2. Assert the upload request is sent and an image component appears on the board.



---

### **6. Important Files & Structure**

```text
/src
  /components
    /canvas
      InfiniteCanvas.tsx   // The main wrapper with Zoom/Pan logic
      CanvasItem.tsx       // Generic wrapper for Notes/Images
      StickyNote.tsx       // Specific note logic
      CursorLayer.tsx      // Renders other users' cursors
    /ui                    // Shadcn components
  /lib
    /store
      useCanvasStore.ts    // Zustand store
    /workers
      realtime.worker.ts   // Web Worker for Supabase Realtime
    supabase.ts            // Supabase client config
  /hooks
    useRealtime.ts         // Hook bridging the Worker
    useDraggable.ts        // GSAP implementation hook

```