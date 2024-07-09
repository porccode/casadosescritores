import type { Database } from "@/types/database.types";

export const ROLES = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  USER: "user",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export type AdminAccessProfile =
  Pick<Database["public"]["Tables"]["profiles"]["Row"], "role" | "is_admin">
  | null
  | undefined;

/**
 * @deprecated Use `role` instead of `is_admin`.
 * The flag is kept for legacy compatibility but will be removed in the future.
 */

export const ADMIN_ACCESS_PROFILE_SELECT = "role, is_admin" as const;

export function isKnownRole(role: unknown): role is UserRole {
  return role === ROLES.ADMIN || role === ROLES.MODERATOR || role === ROLES.USER;
}

export function normalizeUserRole(role: unknown): UserRole {
  return isKnownRole(role) ? role : ROLES.USER;
}

export function isAdminRole(profile: AdminAccessProfile): boolean {
  return normalizeUserRole(profile?.role) === ROLES.ADMIN || profile?.is_admin === true;
}

export function hasModerationAccess(profile: AdminAccessProfile): boolean {
  const role = normalizeUserRole(profile?.role);
  return role === ROLES.ADMIN || role === ROLES.MODERATOR || profile?.is_admin === true;
}

export function getEffectiveRole(profile: AdminAccessProfile): UserRole {
  if (isAdminRole(profile)) {
    return ROLES.ADMIN;
  }

  return normalizeUserRole(profile?.role);
}

export function shouldSyncLegacyAdminFlag(role: unknown): boolean {
  return normalizeUserRole(role) === ROLES.ADMIN;
}
