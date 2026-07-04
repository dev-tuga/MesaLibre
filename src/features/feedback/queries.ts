import { getPrisma } from "@/lib/prisma";

/** Recent guest reviews plus the running average, for the admin overview. */
export async function getReviewSummary(restaurantId: string, limit = 5) {
  const prisma = getPrisma();
  const [aggregate, recent] = await Promise.all([
    prisma.review.aggregate({
      where: { order: { table: { restaurantId } } },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.findMany({
      where: { order: { table: { restaurantId } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        order: { select: { table: { select: { number: true } } } },
      },
    }),
  ]);

  return {
    averageRating: aggregate._avg.rating,
    totalReviews: aggregate._count,
    recent,
  };
}
