import { getPrisma } from "@/lib/prisma";

/** Active shift for a staff member, if any. */
export async function getActiveShift(staffUserId: string) {
  const prisma = getPrisma();
  return prisma.shift.findFirst({
    where: { staffUserId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
}

/** Active shifts in the restaurant (for manager overview). */
export async function getActiveShifts(restaurantId: string) {
  const prisma = getPrisma();
  return prisma.shift.findMany({
    where: { restaurantId, endedAt: null },
    orderBy: { startedAt: "asc" },
    include: {
      staff: { select: { id: true, name: true, role: true } },
      tableServices: {
        where: { releasedAt: null },
        select: { id: true, tableId: true },
      },
    },
  });
}
