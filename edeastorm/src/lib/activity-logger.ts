/** @format */

/**
 * Centralized Activity Logger
 *
 * This module provides a unified interface for logging user activities
 * for security, compliance, and audit purposes.
 *
 * Activities logged include:
 * - Authentication events (login, logout, signup)
 * - Organization events (member added, invitation sent)
 * - Security events (failed login attempts, permission changes)
 * - User actions (board access, data modifications)
 */

import { supabaseAdmin } from "@/lib/supabase";

// Activity action types
export const ActivityActions = {
  // Authentication
  AUTH_LOGIN: "auth.login",
  AUTH_LOGOUT: "auth.logout",
  AUTH_SIGNUP: "auth.signup",
  AUTH_LOGIN_FAILED: "auth.login_failed",
  AUTH_SESSION_EXPIRED: "auth.session_expired",

  // User management
  USER_PROFILE_CREATED: "user.profile_created",
  USER_PROFILE_UPDATED: "user.profile_updated",
  USER_PASSWORD_CHANGED: "user.password_changed",
  USER_EMAIL_CHANGED: "user.email_changed",

  // Organization
  ORG_MEMBER_ADDED: "org.member_added",
  ORG_MEMBER_REMOVED: "org.member_removed",
  ORG_MEMBER_ROLE_CHANGED: "org.member_role_changed",
  ORG_INVITATION_SENT: "org.invitation_sent",
  ORG_INVITATION_ACCEPTED: "org.invitation_accepted",
  ORG_INVITATION_DECLINED: "org.invitation_declined",
  ORG_CREATED: "org.created",
  ORG_UPDATED: "org.updated",

  // Board access
  BOARD_ACCESSED: "board.accessed",
  BOARD_CREATED: "board.created",
  BOARD_UPDATED: "board.updated",
  BOARD_DELETED: "board.deleted",
  BOARD_SHARED: "board.shared",

  // Security
  SECURITY_PERMISSION_DENIED: "security.permission_denied",
  SECURITY_INVALID_TOKEN: "security.invalid_token",
  SECURITY_SUSPICIOUS_ACTIVITY: "security.suspicious_activity",
} as const;

export type ActivityAction = typeof ActivityActions[keyof typeof ActivityActions];

// Entity types
export const EntityTypes = {
  USER: "user",
  ORGANIZATION: "organization",
  BOARD: "board",
  CANVAS_ITEM: "canvas_item",
  INVITATION: "invitation",
  SESSION: "session",
} as const;

export type EntityType = typeof EntityTypes[keyof typeof EntityTypes];

// Activity metadata interface
export interface ActivityMetadata {
  ip_address?: string;
  user_agent?: string;
  provider?: string; // OAuth provider (google, github)
  email?: string;
  organization_id?: string;
  organization_name?: string;
  role?: string;
  inviter_id?: string;
  inviter_name?: string;
  error_message?: string;
  previous_value?: any;
  new_value?: any;
  [key: string]: any;
}

// Activity log entry interface
export interface ActivityLogEntry {
  board_id?: string | null;
  user_id?: string | null;
  action: ActivityAction;
  entity_type?: EntityType;
  entity_id?: string;
  metadata?: ActivityMetadata;
}

/**
 * Main activity logger class
 */
class ActivityLogger {
  private static instance: ActivityLogger;

  private constructor() {}

  static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger();
    }
    return ActivityLogger.instance;
  }

  /**
   * Log an activity to the database
   */
  async log(entry: ActivityLogEntry): Promise<void> {
    try {
      const supabase = supabaseAdmin();

      // activity_log table not in generated types yet, using any
      const { error } = await (supabase as any).from("activity_log").insert({
        board_id: entry.board_id ?? null,
        user_id: entry.user_id ?? null,
        action: entry.action,
        entity_type: entry.entity_type ?? null,
        entity_id: entry.entity_id ?? null,
        metadata: entry.metadata ?? {},
      });

      if (error) {
        console.error("Failed to log activity:", error);
        // Don't throw - activity logging should never break the main flow
      }
    } catch (error) {
      console.error("Exception while logging activity:", error);
      // Don't throw - activity logging should never break the main flow
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(
    action: Extract<ActivityAction, `auth.${string}`>,
    userId?: string,
    metadata?: ActivityMetadata
  ): Promise<void> {
    await this.log({
      user_id: userId || null,
      action,
      entity_type: EntityTypes.SESSION,
      metadata,
    });
  }

  /**
   * Log user management events
   */
  async logUser(
    action: Extract<ActivityAction, `user.${string}`>,
    userId: string,
    metadata?: ActivityMetadata
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      entity_type: EntityTypes.USER,
      entity_id: userId,
      metadata,
    });
  }

  /**
   * Log organization events
   */
  async logOrganization(
    action: Extract<ActivityAction, `org.${string}`>,
    userId: string,
    organizationId: string,
    metadata?: ActivityMetadata
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      entity_type: EntityTypes.ORGANIZATION,
      entity_id: organizationId,
      metadata: {
        ...metadata,
        organization_id: organizationId,
      },
    });
  }

  /**
   * Log board access and modifications
   */
  async logBoard(
    action: Extract<ActivityAction, `board.${string}`>,
    userId: string,
    boardId: string,
    metadata?: ActivityMetadata
  ): Promise<void> {
    await this.log({
      board_id: boardId,
      user_id: userId,
      action,
      entity_type: EntityTypes.BOARD,
      entity_id: boardId,
      metadata,
    });
  }

  /**
   * Log security events
   */
  async logSecurity(
    action: Extract<ActivityAction, `security.${string}`>,
    metadata: ActivityMetadata
  ): Promise<void> {
    await this.log({
      user_id: metadata.user_id || null,
      action,
      entity_type: EntityTypes.SESSION,
      metadata,
    });
  }

  /**
   * Helper to extract metadata from request
   */
  extractRequestMetadata(request?: Request): ActivityMetadata {
    if (!request) return {};

    return {
      ip_address: request.headers.get("x-forwarded-for") ||
                  request.headers.get("x-real-ip") ||
                  "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    };
  }
}

// Export singleton instance
export const activityLogger = ActivityLogger.getInstance();

// Convenience functions for common operations
export const logAuthLogin = (
  userId: string,
  provider: string,
  metadata?: ActivityMetadata
) => {
  return activityLogger.logAuth(ActivityActions.AUTH_LOGIN, userId, {
    ...metadata,
    provider,
  });
};

export const logAuthLogout = (
  userId: string,
  metadata?: ActivityMetadata
) => {
  return activityLogger.logAuth(ActivityActions.AUTH_LOGOUT, userId, metadata);
};

export const logAuthSignup = (
  userId: string,
  provider: string,
  metadata?: ActivityMetadata
) => {
  return activityLogger.logAuth(ActivityActions.AUTH_SIGNUP, userId, {
    ...metadata,
    provider,
  });
};

export const logAuthFailed = (
  email: string,
  metadata?: ActivityMetadata
) => {
  return activityLogger.logAuth(ActivityActions.AUTH_LOGIN_FAILED, undefined, {
    ...metadata,
    email,
  });
};

export const logInvitationSent = (
  inviterId: string,
  organizationId: string,
  recipientEmail: string,
  role: string,
  metadata?: ActivityMetadata
) => {
  return activityLogger.logOrganization(
    ActivityActions.ORG_INVITATION_SENT,
    inviterId,
    organizationId,
    {
      ...metadata,
      email: recipientEmail,
      role,
    }
  );
};

export const logInvitationAccepted = (
  userId: string,
  organizationId: string,
  metadata?: ActivityMetadata
) => {
  return activityLogger.logOrganization(
    ActivityActions.ORG_INVITATION_ACCEPTED,
    userId,
    organizationId,
    metadata
  );
};

export const logMemberAdded = (
  adminId: string,
  organizationId: string,
  newMemberId: string,
  role: string,
  metadata?: ActivityMetadata
) => {
  return activityLogger.logOrganization(
    ActivityActions.ORG_MEMBER_ADDED,
    adminId,
    organizationId,
    {
      ...metadata,
      new_member_id: newMemberId,
      role,
    }
  );
};

export const logMemberRemoved = (
  adminId: string,
  organizationId: string,
  removedMemberId: string,
  metadata?: ActivityMetadata
) => {
  return activityLogger.logOrganization(
    ActivityActions.ORG_MEMBER_REMOVED,
    adminId,
    organizationId,
    {
      ...metadata,
      removed_member_id: removedMemberId,
    }
  );
};

export const logBoardAccessed = (
  userId: string,
  boardId: string,
  metadata?: ActivityMetadata
) => {
  return activityLogger.logBoard(
    ActivityActions.BOARD_ACCESSED,
    userId,
    boardId,
    metadata
  );
};
