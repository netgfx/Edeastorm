import { useMemo } from "react";
import {
  OrganizationRole,
  hasPermission,
  PERMISSIONS,
} from "@/lib/permissions";

export function usePermissions(role: string | undefined | null) {
  return useMemo(
    () => ({
      canManageOrganization: hasPermission(
        role,
        PERMISSIONS.MANAGE_ORGANIZATION
      ),
      canManageTeam: hasPermission(role, PERMISSIONS.MANAGE_TEAM),
      canCreateBoard: hasPermission(role, PERMISSIONS.CREATE_BOARD),
      canDeleteAnyBoard: hasPermission(role, PERMISSIONS.DELETE_ANY_BOARD),
      canViewTeam: hasPermission(role, PERMISSIONS.VIEW_TEAM),
    }),
    [role]
  );
}
