import { OrganizationRole, Permission, ROLE_PERMISSIONS } from "./constants";

export type {
  OrganizationRole,
  Permission,
  ROLE_PERMISSIONS,
} from "./constants";
export { PERMISSIONS } from "./constants";

export function hasPermission(
  role: string | undefined | null,
  permission: Permission
): boolean {
  if (!role) return false;
  // Type assertion since we're dealing with string inputs that should match our roles
  const permissions = ROLE_PERMISSIONS[role as OrganizationRole];
  return permissions?.includes(permission) ?? false;
}

export function getPermissions(role: OrganizationRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
