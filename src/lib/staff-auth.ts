import type { StaffRole } from "@prisma/client";

import type { getAdminSession } from "@/lib/auth";

export type StaffSession = NonNullable<Awaited<ReturnType<typeof getAdminSession>>> & {
  user: {
    role: StaffRole;
  };
};

export function isManagerOrOwner(role: StaffRole): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function canManageStaff(role: StaffRole): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function canViewPerformance(role: StaffRole): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function canViewReviews(role: StaffRole): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function canManageMenu(role: StaffRole): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function canViewAllTables(role: StaffRole): boolean {
  return role === "OWNER" || role === "MANAGER";
}
