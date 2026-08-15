/** @format */

"use client";

import { useCallback } from "react";
import { useActivityStore } from "@/store/activityStore";
import { ActivityActions } from "@/lib/activity-logger";
import type { ActivityMetadata } from "@/lib/activity-logger";

/**
 * Hook for logging activities from client components
 *
 * Usage:
 * ```tsx
 * const { logActivity } = useActivityLogger();
 *
 * // Log a board access
 * await logActivity(ActivityActions.BOARD_ACCESSED, {
 *   boardId: 'board-123',
 *   metadata: { board_name: 'My Board' }
 * });
 * ```
 */
export function useActivityLogger() {
  const { logActivity: storeLogActivity, updateLastActivityTime } =
    useActivityStore();

  const logActivity = useCallback(
    async (
      action: string,
      options?: {
        entityType?: string;
        entityId?: string;
        boardId?: string;
        metadata?: ActivityMetadata;
      }
    ) => {
      try {
        await storeLogActivity(action, options);
        updateLastActivityTime();
      } catch (error) {
        console.error("Failed to log activity:", error);
      }
    },
    [storeLogActivity, updateLastActivityTime]
  );

  // Convenience methods for common activities
  const logBoardAccess = useCallback(
    (boardId: string, metadata?: ActivityMetadata) => {
      return logActivity(ActivityActions.BOARD_ACCESSED, {
        boardId,
        entityType: "board",
        entityId: boardId,
        metadata,
      });
    },
    [logActivity]
  );

  const logBoardCreated = useCallback(
    (boardId: string, metadata?: ActivityMetadata) => {
      return logActivity(ActivityActions.BOARD_CREATED, {
        boardId,
        entityType: "board",
        entityId: boardId,
        metadata,
      });
    },
    [logActivity]
  );

  const logBoardUpdated = useCallback(
    (boardId: string, metadata?: ActivityMetadata) => {
      return logActivity(ActivityActions.BOARD_UPDATED, {
        boardId,
        entityType: "board",
        entityId: boardId,
        metadata,
      });
    },
    [logActivity]
  );

  return {
    logActivity,
    logBoardAccess,
    logBoardCreated,
    logBoardUpdated,
    ActivityActions,
  };
}

/**
 * Hook for tracking user session
 */
export function useSessionActivity() {
  const { sessionStartTime, setSessionStartTime, updateLastActivityTime } =
    useActivityStore();

  const startSession = useCallback(() => {
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
      updateLastActivityTime();
    }
  }, [sessionStartTime, setSessionStartTime, updateLastActivityTime]);

  const endSession = useCallback(() => {
    setSessionStartTime(null);
  }, [setSessionStartTime]);

  return {
    startSession,
    endSession,
    isActive: !!sessionStartTime,
  };
}
