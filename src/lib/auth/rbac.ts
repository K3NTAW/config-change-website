export const ROLES = {
  ADMIN: "ADMIN",
  BASIC: "BASIC",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ADMIN_PAGE_PREFIXES = ["/admin"] as const;

export const API_ROUTE_PERMISSIONS = {
  "/api/admin/registration-requests": ROLES.ADMIN,
} as const;

export function isAdminPageRoute(pathname: string): boolean {
  return ADMIN_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function hasRequiredRole(userRole: string, requiredRole: string): boolean {
  if (userRole === ROLES.ADMIN) return true;
  return userRole === requiredRole;
}
