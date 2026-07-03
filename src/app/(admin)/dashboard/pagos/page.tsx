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
import { getPaymentHistory } from "@/features/payments/queries";
import { getAdminSession } from "@/lib/auth";
import { formatClp, formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Pagos",
};

export default async function PaymentsHistoryPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login");
  const payments = await getPaymentHistory(session.user.restaurantId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Historial de pagos</h1>

      {payments.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-xl border p-6 text-center">
          Todavía no se registran pagos.
        </p>
      ) : (
        <div className="bg-card rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Mesa</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Propina</TableHead>
                <TableHead className="text-right">División</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Cuenta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(payment.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">Mesa {payment.order.table.number}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatClp(payment.amountClp)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {payment.tipClp > 0 ? (
                      formatClp(payment.tipClp)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {payment.splitCount > 1 ? `1 de ${payment.splitCount}` : "Completo"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.method === "CARD" ? "Tarjeta" : payment.method}
                  </TableCell>
                  <TableCell>
                    {payment.order.status === "PAID" ? (
                      <Badge variant="secondary">Cerrada</Badge>
                    ) : (
                      <Badge variant="outline">Abierta</Badge>
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
