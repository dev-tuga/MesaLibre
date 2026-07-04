import { describe, expect, it } from "vitest";

import {
  canManageMenu,
  canManageStaff,
  canViewAllTables,
  canViewPerformance,
  isManagerOrOwner,
} from "@/lib/staff-auth";

describe("staff permissions", () => {
  it("owners and managers share operational visibility", () => {
    expect(isManagerOrOwner("OWNER")).toBe(true);
    expect(isManagerOrOwner("MANAGER")).toBe(true);
    expect(isManagerOrOwner("WAITER")).toBe(false);
  });

  it("only managers and owners manage staff and menu", () => {
    expect(canManageStaff("OWNER")).toBe(true);
    expect(canManageMenu("MANAGER")).toBe(true);
    expect(canManageStaff("WAITER")).toBe(false);
    expect(canManageMenu("WAITER")).toBe(false);
  });

  it("waiters cannot view all tables or performance dashboards", () => {
    expect(canViewAllTables("WAITER")).toBe(false);
    expect(canViewPerformance("WAITER")).toBe(false);
    expect(canViewAllTables("OWNER")).toBe(true);
    expect(canViewPerformance("MANAGER")).toBe(true);
  });
});
