import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getMenuForAdmin } from "@/features/menu/queries";
import { HeadCountSelector } from "@/features/orders/components/head-count-selector";
import { WaiterBillLines } from "@/features/orders/components/waiter-bill-lines";
import { WaiterMenuPicker } from "@/features/orders/components/waiter-menu-picker";
import { getWaiterOrderContext } from "@/features/orders/queries/waiter-order";
import { getAdminSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { formatClp } from "@/lib/format";
import { buildTableUrl } from "@/lib/urls";

type PageProps = {
  params: Promise<{ tableId: string }>;
};

export const metadata: Metadata = {
  title: "Pedido de mesa",
};

export default async function WaiterOrderPage({ params }: PageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/login");

  const { tableId } = await params;
  const [context, menu] = await Promise.all([
    getWaiterOrderContext(tableId, session.user.restaurantId),
    getMenuForAdmin(session.user.restaurantId),
  ]);
  if (!context) notFound();

  const guestUrl = buildTableUrl(
    env.NEXT_PUBLIC_APP_BASE_URL,
    context.table.restaurantSlug,
    context.table.qrToken,
  );
  const headCount = context.order?.headCount ?? 1;
  const frozen = context.order?.hasPayments ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Volver a mesas">
            <Link href="/dashboard/mesas">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Mesa {context.table.number}
            </h1>
            <p className="text-muted-foreground text-sm">{context.table.restaurantName}</p>
          </div>
        </div>
        <Badge variant="secondary">Garzón</Badge>
      </div>

      <HeadCountSelector tableId={context.table.id} value={headCount} disabled={frozen} />

      <Separator />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Cuenta actual</h2>
          <span className="text-lg font-bold tabular-nums">{formatClp(context.bill.totalClp)}</span>
        </div>
        <WaiterBillLines
          tableId={context.table.id}
          items={context.order?.items ?? []}
          editable={!frozen}
        />
        {context.paidClp > 0 ? (
          <p className="text-muted-foreground text-sm">
            Ya pagado: {formatClp(context.paidClp)} · Queda {formatClp(context.remainingClp)}
          </p>
        ) : null}
      </section>

      <Separator />

      <WaiterMenuPicker tableId={context.table.id} categories={menu} disabled={frozen} />

      <div className="bg-muted/40 rounded-xl border p-4 text-sm">
        <p className="font-medium">Vista del comensal (QR)</p>
        <a
          href={guestUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary mt-1 block truncate underline-offset-2 hover:underline"
        >
          {guestUrl}
        </a>
      </div>
    </div>
  );
}
