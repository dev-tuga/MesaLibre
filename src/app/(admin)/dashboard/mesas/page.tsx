import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { QrCode, UtensilsCrossed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOpenTables } from "@/features/orders/queries";
import { RegenerateTokenButton } from "@/features/tables/components/regenerate-token-button";
import { TableQr } from "@/features/tables/components/table-qr";
import { getTablesForAdmin } from "@/features/tables/queries";
import { getAdminSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { formatClp, formatDateTime } from "@/lib/format";
import { buildTableUrl } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Mesas abiertas",
};

export default async function OpenTablesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login");
  const [openTables, allTables] = await Promise.all([
    getOpenTables(session.user.restaurantId),
    getTablesForAdmin(session.user.restaurantId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Mesas abiertas</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/mesas/qr">
            <QrCode />
            Imprimir hoja de QRs
          </Link>
        </Button>
      </div>

      {openTables.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-xl border p-6 text-center">
          No hay mesas con cuentas abiertas en este momento.
        </p>
      ) : (
        <div className="bg-card rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mesa</TableHead>
                <TableHead>Abierta desde</TableHead>
                <TableHead className="text-right">Ítems</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead className="text-right">Por cobrar</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openTables.map((table) => (
                <TableRow key={table.orderId}>
                  <TableCell className="font-medium">Mesa {table.tableNumber}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(table.openedAt)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{table.itemCount}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatClp(table.totalClp)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {table.paidClp > 0 ? (
                      formatClp(table.paidClp)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {table.remainingClp > 0 ? (
                      formatClp(table.remainingClp)
                    ) : (
                      <Badge variant="secondary">Pagada</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/mesas/${table.tableId}/pedido`}>
                        <UtensilsCrossed className="size-4" />
                        Pedido
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <section aria-labelledby="qr-mesas" className="space-y-3">
        <h2 id="qr-mesas" className="text-lg font-semibold tracking-tight">
          QR de cada mesa
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {allTables.map((table) => {
            const url = buildTableUrl(
              env.NEXT_PUBLIC_APP_BASE_URL,
              table.restaurant.slug,
              table.qrToken,
            );
            return (
              <div
                key={table.id}
                className="bg-card flex flex-col items-center gap-3 rounded-xl border p-4"
              >
                <p className="font-semibold">Mesa {table.number}</p>
                <TableQr url={url} className="w-28 [&_svg]:h-auto [&_svg]:w-full" />
                <Button asChild size="sm" className="w-full">
                  <Link href={`/dashboard/mesas/${table.id}/pedido`}>
                    <UtensilsCrossed className="size-4" />
                    Tomar pedido
                  </Link>
                </Button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground max-w-full truncate text-xs underline-offset-2 hover:underline"
                >
                  {url}
                </a>
                <RegenerateTokenButton tableId={table.id} tableNumber={table.number} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
