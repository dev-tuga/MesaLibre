import { getPrisma } from "@/lib/prisma";

export async function getStaffForRestaurant(restaurantId: string) {
  const prisma = getPrisma();
  return prisma.adminUser.findMany({
    where: { restaurantId, isActive: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      shifts: {
        where: { endedAt: null },
        take: 1,
        select: { id: true, startedAt: true },
      },
      tableServices: {
        where: { releasedAt: null },
        select: { id: true, table: { select: { number: true } } },
      },
    },
  });
}
