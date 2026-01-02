/** @format */

"use client";

import { useEffect, useCallback } from "react";
import { useEditorStore } from "@/store/editorStore";
import { throttle } from "@/lib/utils";

interface CursorBroadcasterProps {
  worker: any; // Type this properly if possible, or use the return type of useRealtimeWorker
  roomUserId: string | null;
}

export function CursorBroadcaster({
  worker,
  roomUserId,
}: CursorBroadcasterProps) {
  const broadcastCursor = useCallback(
    throttle((x: number, y: number) => {
      if (roomUserId) {
        worker.broadcastCursor(roomUserId, { x, y });
      }
    }, 300), // Throttled to 300ms as requested
    [roomUserId, worker]
  );

  useEffect(() => {
    // Subscribe to cursorPosition changes without triggering re-renders
    const unsubscribe = useEditorStore.subscribe(
      (state) => {
        const cursorPosition = state.cursorPosition;
        if (cursorPosition.x > 0 && cursorPosition.y > 0) {
          broadcastCursor(cursorPosition.x, cursorPosition.y);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [broadcastCursor]);

  return null;
}
