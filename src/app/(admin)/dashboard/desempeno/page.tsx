import type { StaffRole } from "@prisma/client";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResponsiveTable } from "@/components/responsive-table";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStaffPerformance } from "@/features/staff/queries/performance";
import { getStaffSession } from "@/features/staff/session";
import { staffRoleLabel } from "@/features/staff/labels";
import { canViewPerformance } from "@/lib/staff-auth";
import { formatClp } from "@/lib/format";

export const metadata: Metadata = {
  title: "Desempeño del equipo",
};

export default async function PerformancePage() {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  if (!canViewPerformance(session.user.role)) redirect("/dashboard");

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const rows = await getStaffPerformance(session.user.restaurantId, { since });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Desempeño del equipo</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Métricas del día por garzón: mesas atendidas, ventas y propinas.
        </p>
      </div>

      <ResponsiveTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Integrante</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Mesas</TableHead>
              <TableHead className="text-right">Cuentas cerradas</TableHead>
              <TableHead className="text-right">Ventas</TableHead>
              <TableHead className="text-right">Propinas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.staffId}>
                <TableCell className="font-medium">{row.staffName}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{staffRoleLabel(row.role as StaffRole)}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.tablesServed}</TableCell>
                <TableCell className="text-right tabular-nums">{row.ordersClosed}</TableCell>
                <TableCell className="text-right tabular-nums">{formatClp(row.salesClp)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatClp(row.tipsClp)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ResponsiveTable>
    </div>
  );
}
