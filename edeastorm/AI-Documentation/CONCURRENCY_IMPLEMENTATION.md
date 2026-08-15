# Concurrent Multi-User Implementation

## Overview

This document describes the concurrency control mechanisms implemented to handle multiple users editing the same canvas simultaneously.

## Implemented Features

### 1. Optimistic Locking with Version Control

**Database Migration: `013_add_version_control.sql`**

- Added `version` column to `canvas_items` table
- Auto-increment trigger on every update
- SQL function `update_canvas_item_with_version()` for atomic version checking

**How it works:**

1. Each canvas item has a version number (starts at 1)
2. On update, client sends expected version
3. Database checks if current version matches expected
4. If match: update succeeds, version increments
5. If mismatch: returns current item state, client merges changes

### 2. Drag-and-Drop Conflict Prevention

**Changes in `NodeController.tsx`:**

- Sets `isDraggingNode` in store when drag starts
- Clears `isDraggingNode` when drag ends
- Only sends final position to server on drag end (not continuous updates)

**Changes in Realtime Handler:**

- Checks if item is currently being dragged before applying updates
- Skips position updates for items user is actively dragging
- Prevents "jumping" or "fighting" between local drag and remote updates

### 3. Version Conflict Resolution

**User Experience:**

- If version conflict detected after drag, shows toast notification
- Automatically updates local state with latest server version
- User sees that someone else modified the item

## How to Test

1. **Run the migration:**

   ```bash
   cd edeastorm
   npm run migrate
   ```

2. **Open two browser windows:**

   - Window A: Navigate to a board
   - Window B: Open same board in incognito/different browser

3. **Test scenarios:**
   - **Concurrent drag:** Both users drag same item - last one wins, but shows notification
   - **Drag during remote update:** Dragging won't be interrupted by remote position changes
   - **Sequential edits:** Users can edit different properties without conflicts

## Technical Details

### Version Control Flow

```
Client 1: Get item (version: 1)
Client 2: Get item (version: 1)
Client 1: Update item (expected: 1) → Success (version: 2)
Client 2: Update item (expected: 1) → Conflict! Gets version 2 data
```

### Realtime Update Flow

```
User drags item → Sets isDraggingNode
Remote update arrives → Checks isDraggingNode → Skips update if dragging
User drops item → Clears isDraggingNode → Sends final position with version
```

## Limitations & Future Improvements

### Current Limitations

1. **Text editing conflicts:** Last write wins for note content
2. **No merge strategy:** Conflicts resolved by taking server version
3. **No lock indication:** Users don't see who's editing what in real-time

### Recommended Enhancements

1. **Text editing CRDT:** Use Yjs or Automerge for collaborative text
2. **Visual locks:** Show avatar/indicator when someone is editing
3. **Edit sessions:** Track who's actively editing each item
4. **Undo/Redo:** Version history for rollback

## Performance Considerations

- Version checking adds minimal overhead (~1ms)
- Realtime updates filtered client-side (no DB impact)
- Final position only sent on drag end (reduces network traffic)
- Existing 5px threshold prevents micro-updates

## Migration Notes

The migration is backwards compatible:

- Existing items get version = 1
- Old API calls work without version checking
- New optimistic locking is opt-in via parameter
