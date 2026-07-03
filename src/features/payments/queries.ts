import { prisma } from "@/lib/prisma";

/** Latest payments of a restaurant for the admin history view. */
export async function getPaymentHistory(restaurantId: string, limit = 50) {
  return prisma.payment.findMany({
    where: { order: { table: { restaurantId } } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      order: {
        select: {
          id: true,
          status: true,
          table: { select: { number: true } },
        },
      },
    },
  });
}

export type PaymentHistoryEntry = Awaited<ReturnType<typeof getPaymentHistory>>[number];

/** Aggregates shown on the dashboard overview. */
export async function getPaymentStats(restaurantId: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [today, allTime] = await Promise.all([
    prisma.payment.aggregate({
      where: { order: { table: { restaurantId } }, createdAt: { gte: startOfToday } },
      _sum: { amountClp: true, tipClp: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { order: { table: { restaurantId } } },
      _sum: { amountClp: true, tipClp: true },
      _count: true,
    }),
  ]);

  return {
    today: {
      count: today._count,
      amountClp: today._sum.amountClp ?? 0,
      tipClp: today._sum.tipClp ?? 0,
    },
    allTime: {
      count: allTime._count,
      amountClp: allTime._sum.amountClp ?? 0,
      tipClp: allTime._sum.tipClp ?? 0,
    },
  };
}
