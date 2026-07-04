import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTableByQrToken } from "@/features/menu/queries";
import { tableRouteParamsSchema } from "@/features/menu/schemas/route-params";
import { AutoRefresh } from "@/features/orders/components/auto-refresh";
import { BillLines } from "@/features/orders/components/bill-lines";
import { getOpenOrder, toBill } from "@/features/orders/queries";
import { remainingBalance } from "@/features/payments/services/quote";
import { formatClp } from "@/lib/format";

type PageProps = {
  params: Promise<{ slug: string; table: string }>;
};

export const metadata: Metadata = {
  title: "Cuenta",
};

export default async function TableBillPage({ params }: PageProps) {
  const parsed = tableRouteParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();

  const table = await getTableByQrToken(parsed.data.slug, parsed.data.table);
  if (!table) notFound();

  const order = await getOpenOrder(table.id);
  const bill = toBill(order);
  const billHref = `/r/${parsed.data.slug}/${parsed.data.table}/cuenta`;

  const paidClp = order?.payments.reduce((sum, p) => sum + p.amountClp, 0) ?? 0;
  const remainingClp = remainingBalance(bill.totalClp, paidClp);
  const hasPayments = paidClp > 0;

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-16">
      <AutoRefresh />

      <header className="flex items-center justify-between gap-3 py-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tu cuenta</h1>
          <p className="text-muted-foreground text-sm">{table.restaurant.name}</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Mesa {table.number}
        </Badge>
      </header>

      {bill.itemCount === 0 ? (
        <div className="bg-card space-y-4 rounded-xl border p-6 text-center">
          <p className="text-muted-foreground">
            Tu garzón todavía no ha cargado productos a esta mesa. La cuenta se actualizará
            automáticamente cuando lleguen los pedidos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <BillLines slug={parsed.data.slug} qrToken={parsed.data.table} bill={bill} editable={false} />

          {hasPayments ? (
            <div className="bg-card space-y-1 rounded-xl border p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ya pagado</span>
                <span className="font-medium tabular-nums">−{formatClp(paidClp)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Queda por pagar</span>
                <span className="tabular-nums">{formatClp(remainingClp)}</span>
              </div>
            </div>
          ) : null}

          {remainingClp > 0 ? (
            <Button asChild size="lg" className="w-full">
              <Link href={`${billHref}/pagar`}>
                Pagar {hasPayments ? formatClp(remainingClp) : "la cuenta"}
              </Link>
            </Button>
          ) : null}

          <p className="text-muted-foreground text-center text-sm">
            {order && order.headCount > 1
              ? `Mesa de ${order.headCount} comensales — la cuenta se actualiza en tiempo real.`
              : "La cuenta se actualiza en tiempo real con lo que carga tu garzón."}
          </p>
        </div>
      )}
    </main>
  );
}
