import { getPrisma } from "@/lib/prisma";

/** All tables of a restaurant with the data needed to render their QR codes. */
export async function getTablesForAdmin(restaurantId: string) {
  const prisma = getPrisma();
  return prisma.table.findMany({
    where: { restaurantId },
    orderBy: { number: "asc" },
    select: {
      id: true,
      number: true,
      qrToken: true,
      restaurant: { select: { name: true, slug: true } },
    },
  });
}

export type AdminTable = Awaited<ReturnType<typeof getTablesForAdmin>>[number];
