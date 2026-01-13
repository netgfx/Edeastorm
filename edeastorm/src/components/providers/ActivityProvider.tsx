/** @format */

"use client";

import { useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useActivityStore } from "@/store/activityStore";
import { useSessionActivity } from "@/hooks/useActivityLogger";

interface ActivityProviderProps {
  children: ReactNode;
}

/**
 * Activity Provider
 *
 * Wraps the application to provide automatic activity tracking:
 * - Starts session when user logs in
 * - Ends session when user logs out
 * - Tracks idle time
 * - Auto-logs session timeout
 *
 * Usage:
 * ```tsx
 * <ActivityProvider>
 *   <App />
 * </ActivityProvider>
 * ```
 */
export function ActivityProvider({ children }: ActivityProviderProps) {
  const { data: session, status } = useSession();
  const { startSession, endSession } = useSessionActivity();
  const { logActivity } = useActivityStore();

  // Start session when user is authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      startSession();
    } else if (status === "unauthenticated") {
      endSession();
    }
  }, [status, session, startSession, endSession]);

  // Track user activity and detect idle timeout
  useEffect(() => {
    if (status !== "authenticated") return;

    let idleTimer: NodeJS.Timeout;
    const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // Log session timeout
        logActivity("auth.session_expired", {
          metadata: {
            reason: "idle_timeout",
            idle_duration: IDLE_TIMEOUT,
          },
        });
      }, IDLE_TIMEOUT);
    };

    // Listen for user activity
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, resetIdleTimer);
    });

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [status, logActivity]);

  // Log page visibility changes
  useEffect(() => {
    if (status !== "authenticated") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden - user switched tabs or minimized
        logActivity("user.page_hidden", {
          metadata: {
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        // Page visible - user returned
        logActivity("user.page_visible", {
          metadata: {
            timestamp: new Date().toISOString(),
          },
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status, logActivity]);

  return <>{children}</>;
}
