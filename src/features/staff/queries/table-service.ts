import { getPrisma } from "@/lib/prisma";

/** Active table assignment (not released). */
export async function getActiveTableService(tableId: string) {
  const prisma = getPrisma();
  return prisma.tableService.findFirst({
    where: { tableId, releasedAt: null },
    include: {
      staff: { select: { id: true, name: true, role: true } },
    },
    orderBy: { claimedAt: "desc" },
  });
}

/** Tables currently claimed by a waiter. */
export async function getMyActiveTableServices(staffUserId: string) {
  const prisma = getPrisma();
  return prisma.tableService.findMany({
    where: { staffUserId, releasedAt: null },
    include: {
      table: { select: { id: true, number: true } },
      order: {
        select: {
          id: true,
          headCount: true,
          items: { select: { quantity: true } },
          payments: { select: { amountClp: true } },
        },
      },
    },
    orderBy: { claimedAt: "asc" },
  });
}

/** All active table services in a restaurant. */
export async function getRestaurantActiveTableServices(restaurantId: string) {
  const prisma = getPrisma();
  return prisma.tableService.findMany({
    where: { restaurantId, releasedAt: null },
    include: {
      staff: { select: { id: true, name: true } },
      table: { select: { id: true, number: true } },
    },
    orderBy: { table: { number: "asc" } },
  });
}

/** Unclaimed tables (no active TableService). */
export async function getUnclaimedTableIds(restaurantId: string, tableIds: string[]) {
  if (tableIds.length === 0) return new Set<string>();

  const prisma = getPrisma();
  const claimed = await prisma.tableService.findMany({
    where: {
      restaurantId,
      tableId: { in: tableIds },
      releasedAt: null,
    },
    select: { tableId: true },
  });

  const claimedSet = new Set(claimed.map((row) => row.tableId));
  return new Set(tableIds.filter((id) => !claimedSet.has(id)));
}
