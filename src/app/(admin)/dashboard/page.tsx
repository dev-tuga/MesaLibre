import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOpenTables } from "@/features/orders/queries";
import { getPaymentStats } from "@/features/payments/queries";
import { getStaffSession } from "@/features/staff/session";
import { formatClp } from "@/lib/format";

export const metadata: Metadata = {
  title: "Resumen",
};

export default async function DashboardOverviewPage() {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  const restaurantId = session.user.restaurantId;

  const [openTables, stats] = await Promise.all([
    getOpenTables(restaurantId),
    getPaymentStats(restaurantId),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Resumen</h1>

      <div className="grid gap-4 sm:grid-cols-2">
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
            {stats.today.count} {stats.today.count === 1 ? "pago" : "pagos"} ·{" "}
            {formatClp(stats.today.tipClp)} en propinas
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
