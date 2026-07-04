import { getPrisma } from "@/lib/prisma";

/**
 * Resolves a table from the public URL (`/r/[slug]/[qrToken]`).
 * The lookup is by QR token — the only secret a guest holds — and the
 * slug is cross-checked so a token cannot be replayed under another
 * restaurant's URL.
 */
export async function getTableByQrToken(slug: string, qrToken: string) {
  const prisma = getPrisma();
  const table = await prisma.table.findUnique({
    where: { qrToken },
    include: { restaurant: true },
  });

  if (!table || table.restaurant.slug !== slug) {
    return null;
  }

  return table;
}

/** Menu of a restaurant: visible categories with their available products, in display order. */
export async function getMenu(restaurantId: string) {
  const prisma = getPrisma();
  return prisma.category.findMany({
    where: { restaurantId, products: { some: { available: true } } },
    orderBy: { position: "asc" },
    include: {
      products: {
        where: { available: true },
        orderBy: { position: "asc" },
      },
    },
  });
}

export type MenuCategory = Awaited<ReturnType<typeof getMenu>>[number];
export type TableWithRestaurant = NonNullable<Awaited<ReturnType<typeof getTableByQrToken>>>;

/** Full menu for the admin panel, including unavailable products and empty categories. */
export async function getMenuForAdmin(restaurantId: string) {
  const prisma = getPrisma();
  return prisma.category.findMany({
    where: { restaurantId },
    orderBy: { position: "asc" },
    include: {
      products: { orderBy: { position: "asc" } },
    },
  });
}

export type AdminMenuCategory = Awaited<ReturnType<typeof getMenuForAdmin>>[number];
