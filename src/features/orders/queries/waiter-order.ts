import { getPrisma } from "@/lib/prisma";

import { calculateBill } from "@/features/orders/services/bill";

/** Table + open order state for the waiter ordering screen. */
export async function getWaiterOrderContext(tableId: string, restaurantId: string) {
  const prisma = getPrisma();
  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurantId },
    include: {
      restaurant: { select: { name: true, slug: true } },
      orders: {
        where: { status: "OPEN" },
        take: 1,
        include: {
          items: {
            orderBy: { createdAt: "asc" },
            include: { product: { select: { name: true } } },
          },
          payments: { select: { amountClp: true } },
        },
      },
    },
  });

  if (!table) return null;

  const order = table.orders[0] ?? null;
  const bill = calculateBill(
    (order?.items ?? []).map((item) => ({
      id: item.id,
      name: item.product.name,
      quantity: item.quantity,
      unitPriceClp: item.unitPriceClp,
    })),
  );
  const paidClp = order?.payments.reduce((sum, p) => sum + p.amountClp, 0) ?? 0;

  return {
    table: {
      id: table.id,
      number: table.number,
      qrToken: table.qrToken,
      restaurantName: table.restaurant.name,
      restaurantSlug: table.restaurant.slug,
    },
    order: order
      ? {
          id: order.id,
          headCount: order.headCount,
          hasPayments: order.payments.length > 0,
          items: order.items.map((item) => ({
            id: item.id,
            name: item.product.name,
            quantity: item.quantity,
            unitPriceClp: item.unitPriceClp,
            lineTotalClp: item.quantity * item.unitPriceClp,
          })),
        }
      : null,
    bill,
    paidClp,
    remainingClp: Math.max(0, bill.totalClp - paidClp),
  };
}
