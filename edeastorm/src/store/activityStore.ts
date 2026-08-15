/** @format */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ActivityMetadata } from "@/lib/activity-logger";

/**
 * Activity Store
 *
 * Client-side store for tracking and managing activity logs.
 * This store handles:
 * - Queuing activities for batch logging
 * - Caching recent activities
 * - Managing activity log UI state
 */

export interface ActivityLog {
  id: string;
  board_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: ActivityMetadata;
  created_at: string;
}

interface ActivityState {
  // Recent activities (cached for UI)
  recentActivities: ActivityLog[];
  setRecentActivities: (activities: ActivityLog[]) => void;
  addActivity: (activity: ActivityLog) => void;

  // Activity queue for batch processing
  activityQueue: Array<{
    action: string;
    entity_type?: string;
    entity_id?: string;
    metadata?: ActivityMetadata;
  }>;
  queueActivity: (activity: {
    action: string;
    entity_type?: string;
    entity_id?: string;
    metadata?: ActivityMetadata;
  }) => void;
  clearQueue: () => void;

  // Filters for activity viewer
  filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    boardId?: string;
    startDate?: string;
    endDate?: string;
  };
  setFilters: (filters: ActivityState["filters"]) => void;
  clearFilters: () => void;

  // UI state
  isLoadingActivities: boolean;
  setIsLoadingActivities: (loading: boolean) => void;

  // Session tracking
  sessionStartTime: number | null;
  setSessionStartTime: (time: number | null) => void;
  lastActivityTime: number;
  updateLastActivityTime: () => void;

  // Helper to log activity via API
  logActivity: (
    action: string,
    options?: {
      entityType?: string;
      entityId?: string;
      boardId?: string;
      metadata?: ActivityMetadata;
    }
  ) => Promise<void>;

  // Reset
  reset: () => void;
}

const initialState = {
  recentActivities: [],
  activityQueue: [],
  filters: {},
  isLoadingActivities: false,
  sessionStartTime: null,
  lastActivityTime: Date.now(),
};

export const useActivityStore = create<ActivityState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setRecentActivities: (activities) =>
        set({ recentActivities: activities }, false, "activity/setRecentActivities"),

      addActivity: (activity) =>
        set(
          (state) => ({
            recentActivities: [activity, ...state.recentActivities].slice(0, 100), // Keep last 100
          }),
          false,
          "activity/addActivity"
        ),

      queueActivity: (activity) =>
        set(
          (state) => ({
            activityQueue: [...state.activityQueue, activity],
          }),
          false,
          "activity/queueActivity"
        ),

      clearQueue: () =>
        set({ activityQueue: [] }, false, "activity/clearQueue"),

      setFilters: (filters) =>
        set({ filters }, false, "activity/setFilters"),

      clearFilters: () =>
        set({ filters: {} }, false, "activity/clearFilters"),

      setIsLoadingActivities: (loading) =>
        set({ isLoadingActivities: loading }, false, "activity/setIsLoadingActivities"),

      setSessionStartTime: (time) =>
        set({ sessionStartTime: time }, false, "activity/setSessionStartTime"),

      updateLastActivityTime: () =>
        set({ lastActivityTime: Date.now() }, false, "activity/updateLastActivityTime"),

      logActivity: async (action, options = {}) => {
        try {
          const response = await fetch("/api/activity/log", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action,
              entity_type: options.entityType,
              entity_id: options.entityId,
              board_id: options.boardId,
              metadata: options.metadata,
            }),
          });

          if (!response.ok) {
            console.error("Failed to log activity:", await response.text());
          }

          // Update last activity time
          get().updateLastActivityTime();
        } catch (error) {
          console.error("Error logging activity:", error);
          // Queue for retry
          get().queueActivity({
            action,
            entity_type: options.entityType,
            entity_id: options.entityId,
            metadata: options.metadata,
          });
        }
      },

      reset: () => set(initialState, false, "activity/reset"),
    }),
    { name: "ActivityStore" }
  )
);

// Hook for tracking session duration
export const useSessionTracking = () => {
  const {
    sessionStartTime,
    setSessionStartTime,
    lastActivityTime,
    updateLastActivityTime,
  } = useActivityStore();

  const startSession = () => {
    const now = Date.now();
    setSessionStartTime(now);
    updateLastActivityTime();
  };

  const getSessionDuration = () => {
    if (!sessionStartTime) return 0;
    return Date.now() - sessionStartTime;
  };

  const getIdleTime = () => {
    return Date.now() - lastActivityTime;
  };

  return {
    startSession,
    getSessionDuration,
    getIdleTime,
    isSessionActive: !!sessionStartTime,
  };
};
