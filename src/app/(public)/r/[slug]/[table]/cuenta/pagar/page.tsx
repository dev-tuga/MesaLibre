import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTableByQrToken } from "@/features/menu/queries";
import { tableRouteParamsSchema } from "@/features/menu/schemas/route-params";
import { getOpenOrder, toBill } from "@/features/orders/queries";
import { PaymentPanel } from "@/features/payments/components/payment-panel";
import { computeBillLineAvailability } from "@/features/payments/services/item-allocation";
import { remainingBalance } from "@/features/payments/services/quote";
import { formatClp } from "@/lib/format";

type PageProps = {
  params: Promise<{ slug: string; table: string }>;
};

export const metadata: Metadata = {
  title: "Pagar la cuenta",
};

export default async function PayBillPage({ params }: PageProps) {
  const parsed = tableRouteParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();

  const table = await getTableByQrToken(parsed.data.slug, parsed.data.table);
  if (!table) notFound();

  const order = await getOpenOrder(table.id);
  const bill = toBill(order);
  const billHref = `/r/${parsed.data.slug}/${parsed.data.table}/cuenta`;

  if (!order || bill.itemCount === 0) {
    redirect(billHref);
  }

  const paidClp = order.payments.reduce((sum, p) => sum + p.amountClp, 0);
  const remainingClp = remainingBalance(bill.totalClp, paidClp);

  if (remainingClp === 0) {
    redirect(billHref);
  }

  const allocations = order.payments.flatMap((payment) => payment.itemAllocations);
  const lines = computeBillLineAvailability(order.items, allocations);

  return (
    <main className="to-background mx-auto min-h-screen max-w-xl bg-gradient-to-b from-slate-50 px-4 pb-16 dark:from-slate-950">
      <header className="flex items-center justify-between gap-3 py-5">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Volver a la cuenta">
            <Link href={billHref}>
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pagar cuenta</h1>
            <p className="text-muted-foreground text-sm">{table.restaurant.name}</p>
          </div>
        </div>
        <Badge variant="secondary" className="rounded-full text-sm">
          Mesa {table.number}
        </Badge>
      </header>

      <div className="bg-card mb-6 rounded-2xl border p-4 shadow-sm">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total de la cuenta</span>
          <span className="font-medium tabular-nums">{formatClp(bill.totalClp)}</span>
        </div>
        {paidClp > 0 ? (
          <>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Ya pagado</span>
              <span className="font-medium tabular-nums">−{formatClp(paidClp)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
              <span>Queda por pagar</span>
              <span className="tabular-nums">{formatClp(remainingClp)}</span>
            </div>
          </>
        ) : null}
      </div>

      <PaymentPanel
        slug={parsed.data.slug}
        qrToken={parsed.data.table}
        remainingClp={remainingClp}
        headCount={order.headCount}
        restaurantName={table.restaurant.name}
        googlePlaceId={table.restaurant.googlePlaceId}
        lines={lines}
      />
    </main>
  );
}
