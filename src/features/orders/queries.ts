import { prisma } from "@/lib/prisma";

import { calculateBill, type Bill } from "@/features/orders/services/bill";

/** The open order of a table, with its items, or null if the table has no open bill. */
export async function getOpenOrder(tableId: string) {
  return prisma.order.findFirst({
    where: { tableId, status: "OPEN" },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: { product: { select: { name: true } } },
      },
      payments: {
        orderBy: { createdAt: "asc" },
        select: { id: true, amountClp: true, tipClp: true, createdAt: true },
      },
    },
  });
}

export type OpenOrder = NonNullable<Awaited<ReturnType<typeof getOpenOrder>>>;

/** Maps a persisted order to the pure bill structure used by services and UI. */
export function toBill(order: OpenOrder | null): Bill {
  if (!order) {
    return calculateBill([]);
  }

  return calculateBill(
    order.items.map((item) => ({
      id: item.id,
      name: item.product.name,
      quantity: item.quantity,
      unitPriceClp: item.unitPriceClp,
    })),
  );
}
