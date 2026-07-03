import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTableByQrToken } from "@/features/menu/queries";
import { tableRouteParamsSchema } from "@/features/menu/schemas/route-params";
import { AutoRefresh } from "@/features/orders/components/auto-refresh";
import { BillLines } from "@/features/orders/components/bill-lines";
import { getOpenOrder, toBill } from "@/features/orders/queries";

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
  const menuHref = `/r/${parsed.data.slug}/${parsed.data.table}`;

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-16">
      <AutoRefresh />

      <header className="flex items-center justify-between gap-3 py-5">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Volver a la carta">
            <Link href={menuHref}>
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cuenta</h1>
            <p className="text-muted-foreground text-sm">{table.restaurant.name}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          Mesa {table.number}
        </Badge>
      </header>

      {bill.itemCount === 0 ? (
        <div className="bg-card space-y-4 rounded-xl border p-6 text-center">
          <p className="text-muted-foreground">Todavía no hay nada en la cuenta.</p>
          <Button asChild variant="outline">
            <Link href={menuHref}>Ver la carta</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <BillLines slug={parsed.data.slug} qrToken={parsed.data.table} bill={bill} />
          <p className="text-muted-foreground text-center text-sm">
            La cuenta es compartida: todos en la mesa ven los mismos ítems.
          </p>
        </div>
      )}
    </main>
  );
}
