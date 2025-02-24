import { describe, expect, it } from "vitest";
import {
  ROLES,
  getEffectiveRole,
  hasModerationAccess,
  isAdminRole,
  normalizeUserRole,
  shouldSyncLegacyAdminFlag,
} from "../roles";

describe("roles helpers", () => {
  it("treats role admin as admin access", () => {
    expect(isAdminRole({ role: ROLES.ADMIN, is_admin: false })).toBe(true);
    expect(getEffectiveRole({ role: ROLES.ADMIN, is_admin: false })).toBe(ROLES.ADMIN);
  });

  it("keeps legacy is_admin support for compatibility", () => {
    expect(isAdminRole({ role: ROLES.USER, is_admin: true })).toBe(true);
    expect(getEffectiveRole({ role: ROLES.USER, is_admin: true })).toBe(ROLES.ADMIN);
  });

  it("allows moderators in moderation-specific checks", () => {
    expect(hasModerationAccess({ role: ROLES.MODERATOR, is_admin: false })).toBe(true);
    expect(isAdminRole({ role: ROLES.MODERATOR, is_admin: false })).toBe(false);
  });

  it("normalizes unknown roles safely", () => {
    expect(normalizeUserRole("owner")).toBe(ROLES.USER);
    expect(shouldSyncLegacyAdminFlag("owner")).toBe(false);
  });
});
