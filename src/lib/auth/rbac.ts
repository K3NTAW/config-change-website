/**
 * IPA-207: Centralized RBAC configuration.
 * Single source of truth for roles and which routes they protect.
 * Least-Privilege: every route has the minimum required role declared here.
 */

export const ROLES = {
  ADMIN: "ADMIN",
  BASIC: "BASIC",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Page-route prefixes that require the ADMIN role.
 * Used by middleware.ts to protect server-rendered admin pages.
 */
export const ADMIN_PAGE_PREFIXES = ["/admin"] as const;

/**
 * API-route prefixes → minimum required role.
 * Used as documentation/reference; enforcement is via requireRole() in each handler.
 */
export const API_ROUTE_PERMISSIONS = {
  "/api/admin/registration-requests": ROLES.ADMIN,
} as const;

/**
 * Returns true when the given pathname falls under an admin-only page route.
 */
export function isAdminPageRoute(pathname: string): boolean {
  return ADMIN_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Returns true when the given role satisfies the required role for a route.
 * Implements Least-Privilege: ADMIN can access ADMIN and BASIC routes, BASIC only BASIC.
 */
export function hasRequiredRole(userRole: string, requiredRole: string): boolean {
  if (userRole === ROLES.ADMIN) return true;
  return userRole === requiredRole;
}
