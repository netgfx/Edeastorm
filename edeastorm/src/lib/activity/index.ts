/** @format */

/**
 * Activity Logging System - Central Export
 *
 * Import everything related to activity logging from here:
 *
 * ```typescript
 * import {
 *   activityLogger,
 *   ActivityActions,
 *   logAuthLogin,
 *   useActivityLogger,
 *   ActivityLog,
 * } from '@/lib/activity';
 * ```
 */

// Core logger
export {
  activityLogger,
  ActivityActions,
  EntityTypes,
  logAuthLogin,
  logAuthLogout,
  logAuthSignup,
  logAuthFailed,
  logInvitationSent,
  logInvitationAccepted,
  logMemberAdded,
  logMemberRemoved,
  logBoardAccessed,
} from "../activity-logger";

export type {
  ActivityAction,
  EntityType,
  ActivityMetadata,
  ActivityLogEntry,
} from "../activity-logger";

// Store
export { useActivityStore, useSessionTracking } from "@/store/activityStore";
export type { ActivityLog } from "@/store/activityStore";

// Hooks
export {
  useActivityLogger,
  useSessionActivity,
} from "@/hooks/useActivityLogger";

// Components
export { ActivityLog as ActivityLogComponent } from "@/components/activity/ActivityLog";
export { ActivityProvider } from "@/components/providers/ActivityProvider";
