import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOpenTables } from "@/features/orders/queries";
import { getAdminSession } from "@/lib/auth";
import { formatClp, formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Mesas abiertas",
};

export default async function OpenTablesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login");
  const openTables = await getOpenTables(session.user.restaurantId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mesas abiertas</h1>

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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
