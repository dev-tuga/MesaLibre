import { getPrisma } from "@/lib/prisma";

export type StaffPerformanceRow = {
  staffId: string;
  staffName: string;
  role: string;
  tablesServed: number;
  ordersClosed: number;
  salesClp: number;
  tipsClp: number;
  avgRating: number | null;
};

/** Aggregated waiter performance for owners and managers. */
export async function getStaffPerformance(
  restaurantId: string,
  options?: { since?: Date; until?: Date },
): Promise<StaffPerformanceRow[]> {
  const prisma = getPrisma();
  const since = options?.since;
  const until = options?.until;

  const staff = await prisma.adminUser.findMany({
    where: { restaurantId, isActive: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, role: true },
  });

  const tableServices = await prisma.tableService.findMany({
    where: {
      restaurantId,
      ...(since || until
        ? {
            claimedAt: {
              ...(since ? { gte: since } : {}),
              ...(until ? { lte: until } : {}),
            },
          }
        : {}),
    },
    select: { staffUserId: true, tableId: true },
  });

  const orders = await prisma.order.findMany({
    where: {
      status: "PAID",
      table: { restaurantId },
      servedByStaffId: { not: null },
      ...(since || until
        ? {
            closedAt: {
              ...(since ? { gte: since } : {}),
              ...(until ? { lte: until } : {}),
            },
          }
        : {}),
    },
    select: {
      id: true,
      servedByStaffId: true,
      payments: { select: { amountClp: true, tipClp: true } },
      review: { select: { rating: true } },
    },
  });

  const tablesByStaff = new Map<string, Set<string>>();
  for (const service of tableServices) {
    const set = tablesByStaff.get(service.staffUserId) ?? new Set<string>();
    set.add(service.tableId);
    tablesByStaff.set(service.staffUserId, set);
  }

  const metricsByStaff = new Map<
    string,
    { orders: number; sales: number; tips: number; ratings: number[] }
  >();

  for (const order of orders) {
    const staffId = order.servedByStaffId!;
    const current = metricsByStaff.get(staffId) ?? {
      orders: 0,
      sales: 0,
      tips: 0,
      ratings: [],
    };
    current.orders += 1;
    for (const payment of order.payments) {
      current.sales += payment.amountClp;
      current.tips += payment.tipClp;
    }
    if (order.review) {
      current.ratings.push(order.review.rating);
    }
    metricsByStaff.set(staffId, current);
  }

  return staff.map((member) => {
    const metrics = metricsByStaff.get(member.id);
    const ratings = metrics?.ratings ?? [];
    return {
      staffId: member.id,
      staffName: member.name,
      role: member.role,
      tablesServed: tablesByStaff.get(member.id)?.size ?? 0,
      ordersClosed: metrics?.orders ?? 0,
      salesClp: metrics?.sales ?? 0,
      tipsClp: metrics?.tips ?? 0,
      avgRating:
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null,
    };
  });
}
