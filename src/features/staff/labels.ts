import type { StaffRole } from "@prisma/client";

const ROLE_LABELS: Record<StaffRole, string> = {
  OWNER: "Dueño",
  MANAGER: "Administrador",
  WAITER: "Garzón",
};

export function staffRoleLabel(role: StaffRole): string {
  return ROLE_LABELS[role];
}
