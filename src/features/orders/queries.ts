import { getPrisma } from "@/lib/prisma";

import { calculateBill, type Bill } from "@/features/orders/services/bill";

/** The open order of a table, with its items, or null if the table has no open bill. */
export async function getOpenOrder(tableId: string) {
  const prisma = getPrisma();
  return prisma.order.findFirst({
    where: { tableId, status: "OPEN" },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: { product: { select: { name: true } } },
      },
      payments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          amountClp: true,
          tipClp: true,
          createdAt: true,
          splitMode: true,
          splitCount: true,
          method: true,
          itemAllocations: {
            select: { orderItemId: true, quantity: true, amountClp: true },
          },
        },
      },
    },
  });
}

export type OpenOrder = NonNullable<Awaited<ReturnType<typeof getOpenOrder>>>;

/** Open tables for the admin dashboard: every OPEN order with its bill status. */
export async function getOpenTables(restaurantId: string, options?: { staffUserId?: string }) {
  const prisma = getPrisma();
  const orders = await prisma.order.findMany({
    where: {
      status: "OPEN",
      table: {
        restaurantId,
        ...(options?.staffUserId
          ? {
              tableServices: {
                some: {
                  staffUserId: options.staffUserId,
                  releasedAt: null,
                },
              },
            }
          : {}),
      },
    },
    orderBy: { createdAt: "asc" },
    include: {
      table: {
        select: {
          number: true,
          id: true,
          tableServices: {
            where: { releasedAt: null },
            take: 1,
            include: { staff: { select: { id: true, name: true } } },
          },
        },
      },
      servedBy: { select: { id: true, name: true } },
      items: {
        orderBy: { createdAt: "asc" },
        include: { product: { select: { name: true } } },
      },
      payments: { select: { amountClp: true } },
    },
  });

  return orders.map((order) => {
    const bill = calculateBill(
      order.items.map((item) => ({
        id: item.id,
        name: item.product.name,
        quantity: item.quantity,
        unitPriceClp: item.unitPriceClp,
      })),
    );
    const paidClp = order.payments.reduce((sum, p) => sum + p.amountClp, 0);
    const assignment = order.table.tableServices[0];

    return {
      orderId: order.id,
      tableId: order.table.id,
      tableNumber: order.table.number,
      openedAt: order.createdAt,
      itemCount: bill.itemCount,
      totalClp: bill.totalClp,
      paidClp,
      remainingClp: Math.max(0, bill.totalClp - paidClp),
      waiterName: assignment?.staff.name ?? order.servedBy?.name ?? null,
      waiterId: assignment?.staff.id ?? order.servedBy?.id ?? null,
    };
  });
}

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
