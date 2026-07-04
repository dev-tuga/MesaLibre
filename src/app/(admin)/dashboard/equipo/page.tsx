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
import { getStaffForRestaurant } from "@/features/staff/queries/staff-list";
import { getStaffSession } from "@/features/staff/session";
import { staffRoleLabel } from "@/features/staff/labels";
import { canManageStaff } from "@/lib/staff-auth";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Equipo",
};

export default async function TeamPage() {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  if (!canManageStaff(session.user.role)) redirect("/dashboard");

  const staff = await getStaffForRestaurant(session.user.restaurantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
        <p className="text-muted-foreground text-sm">
          Garzones y administradores del local. Asigna mesas desde la vista de mesas.
        </p>
      </div>

      <div className="bg-card rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Mesas activas</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{staffRoleLabel(member.role)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {member.shifts[0] ? `Desde ${formatDateTime(member.shifts[0].startedAt)}` : "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {member.tableServices.length > 0
                    ? member.tableServices
                        .map((service) => `Mesa ${service.table.number}`)
                        .join(", ")
                    : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{member.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
