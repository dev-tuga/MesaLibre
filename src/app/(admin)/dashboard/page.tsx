import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReviewSummary } from "@/features/feedback/queries";
import { getOpenTables } from "@/features/orders/queries";
import { getPaymentStats } from "@/features/payments/queries";
import { getAdminSession } from "@/lib/auth";
import { formatClp } from "@/lib/format";

export const metadata: Metadata = {
  title: "Resumen",
};

export default async function DashboardOverviewPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login");
  const restaurantId = session.user.restaurantId;

  const [openTables, stats, reviews] = await Promise.all([
    getOpenTables(restaurantId),
    getPaymentStats(restaurantId),
    getReviewSummary(restaurantId),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Resumen</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Mesas abiertas</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{openTables.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {formatClp(openTables.reduce((sum, t) => sum + t.remainingClp, 0))} por cobrar
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Ventas de hoy</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatClp(stats.today.amountClp)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {stats.today.count} pagos · {formatClp(stats.today.tipClp)} en propinas
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Calificación promedio</CardDescription>
            <CardTitle className="flex items-center gap-1 text-3xl tabular-nums">
              {reviews.averageRating ? reviews.averageRating.toFixed(1) : "—"}
              <Star className="size-5 fill-amber-400 text-amber-400" aria-hidden />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {reviews.totalReviews} {reviews.totalReviews === 1 ? "reseña" : "reseñas"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas reseñas</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">Todavía no hay reseñas.</p>
          ) : (
            <ul className="space-y-4">
              {reviews.recent.map((review) => (
                <li key={review.id} className="flex items-start gap-3">
                  <span className="flex shrink-0 items-center gap-1 font-medium tabular-nums">
                    {review.rating}
                    <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm">
                      {review.comment ?? (
                        <span className="text-muted-foreground italic">Sin comentario</span>
                      )}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Mesa {review.order.table.number}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
