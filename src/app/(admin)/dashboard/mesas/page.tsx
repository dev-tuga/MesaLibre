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
import { AssignTableSelect } from "@/features/staff/components/assign-table-select";
import { ClaimTableButton } from "@/features/staff/components/claim-table-button";
import { ReleaseTableButton } from "@/features/staff/components/release-table-button";
import { ShiftControls } from "@/features/staff/components/shift-controls";
import { getActiveShift } from "@/features/staff/queries/shift";
import {
  getRestaurantActiveTableServices,
  getUnclaimedTableIds,
} from "@/features/staff/queries/table-service";
import { getStaffForRestaurant } from "@/features/staff/queries/staff-list";
import { getStaffSession } from "@/features/staff/session";
import { staffRoleLabel } from "@/features/staff/labels";
import { RegenerateTokenButton } from "@/features/tables/components/regenerate-token-button";
import { TableQr } from "@/features/tables/components/table-qr";
import { getTablesForAdmin } from "@/features/tables/queries";
import { getPublicBaseUrl } from "@/lib/app-url";
import { formatClp, formatDateTime } from "@/lib/format";
import { canManageStaff, canViewAllTables } from "@/lib/staff-auth";
import { buildTableUrl } from "@/lib/urls";
import { ResponsiveTable } from "@/components/responsive-table";

export const metadata: Metadata = {
  title: "Mesas abiertas",
};

export default async function OpenTablesPage() {
  const session = await getStaffSession();
  if (!session) redirect("/login");

  const isManager = canViewAllTables(session.user.role);
  const restaurantId = session.user.restaurantId;

  const [openTables, allTables, activeShift, assignments, staff] = await Promise.all([
    getOpenTables(restaurantId, isManager ? undefined : { staffUserId: session.user.id }),
    getTablesForAdmin(restaurantId),
    getActiveShift(session.user.id),
    getRestaurantActiveTableServices(restaurantId),
    isManager ? getStaffForRestaurant(restaurantId) : Promise.resolve([]),
  ]);

  const assignmentByTable = new Map(assignments.map((row) => [row.table.id, row]));
  const waiters = staff.filter((member) => member.role === "WAITER" || member.role === "MANAGER");
  const unclaimedIds = isManager
    ? new Set<string>()
    : await getUnclaimedTableIds(
        restaurantId,
        allTables.map((table) => table.id),
      );

  const baseUrl = await getPublicBaseUrl();

  const myTables = isManager
    ? allTables.filter((table) => assignmentByTable.get(table.id)?.staff.id === session.user.id)
    : allTables.filter((table) => assignmentByTable.get(table.id)?.staff.id === session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isManager ? "Mesas abiertas" : "Mis mesas"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {session.user.name} · {staffRoleLabel(session.user.role)}
          </p>
        </div>
        {isManager ? (
          <Button asChild variant="outline">
            <Link href="/dashboard/mesas/qr">
              <QrCode />
              Imprimir hoja de QRs
            </Link>
          </Button>
        ) : null}
      </div>

      <ShiftControls
        hasActiveShift={Boolean(activeShift)}
        showForRole={session.user.role === "WAITER"}
      />

      {openTables.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-xl border p-6 text-center">
          {isManager
            ? "No hay mesas con cuentas abiertas en este momento."
            : "No tienes mesas abiertas asignadas. Toma una mesa para comenzar."}
        </p>
      ) : (
        <ResponsiveTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mesa</TableHead>
                {isManager ? <TableHead>Garzón</TableHead> : null}
                <TableHead>Abierta desde</TableHead>
                <TableHead className="text-right">Ítems</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Por cobrar</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openTables.map((table) => (
                <TableRow key={table.orderId}>
                  <TableCell className="font-medium">Mesa {table.tableNumber}</TableCell>
                  {isManager ? (
                    <TableCell className="text-muted-foreground text-sm">
                      {table.waiterName ?? "Sin asignar"}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(table.openedAt)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{table.itemCount}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatClp(table.totalClp)}
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
        </ResponsiveTable>
      )}

      <section aria-labelledby="mesas-asignacion" className="space-y-3">
        <h2 id="mesas-asignacion" className="text-lg font-semibold tracking-tight">
          {isManager ? "Asignación de mesas" : "Mesas disponibles"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {allTables.map((table) => {
            const assignment = assignmentByTable.get(table.id);
            const isMine = assignment?.staff.id === session.user.id;
            const isUnclaimed = !assignment;
            const canClaim =
              (!isManager && isUnclaimed && Boolean(activeShift)) || (isManager && isUnclaimed);
            const canPedido = isManager || isMine;

            return (
              <div key={table.id} className="bg-card flex flex-col gap-3 rounded-xl border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">Mesa {table.number}</p>
                  {assignment ? (
                    <Badge variant={isMine ? "default" : "secondary"}>
                      {assignment.staff.name}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Libre</Badge>
                  )}
                </div>

                {isManager && canManageStaff(session.user.role) ? (
                  <AssignTableSelect
                    tableId={table.id}
                    waiters={waiters.map((w) => ({ id: w.id, name: w.name }))}
                    currentWaiterId={assignment?.staff.id}
                  />
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {canClaim ? <ClaimTableButton tableId={table.id} className="flex-1" /> : null}
                  {(isMine || (isManager && assignment)) && assignment ? (
                    <ReleaseTableButton tableId={table.id} />
                  ) : null}
                  {canPedido ? (
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/dashboard/mesas/${table.id}/pedido`}>
                        <UtensilsCrossed className="size-4" />
                        Pedido
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {isManager ? (
        <section aria-labelledby="qr-mesas" className="space-y-3">
          <h2 id="qr-mesas" className="text-lg font-semibold tracking-tight">
            QR de cada mesa
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {allTables.map((table) => {
              const url = buildTableUrl(baseUrl, table.restaurant.slug, table.qrToken);
              return (
                <div
                  key={table.id}
                  className="bg-card flex flex-col items-center gap-3 rounded-xl border p-4"
                >
                  <p className="font-semibold">Mesa {table.number}</p>
                  <TableQr url={url} className="w-28 [&_svg]:h-auto [&_svg]:w-full" />
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
      ) : null}

      {!isManager && myTables.length === 0 && unclaimedIds.size > 0 ? (
        <p className="text-muted-foreground text-center text-sm">
          Hay {unclaimedIds.size} mesas libres. Inicia tu turno y pulsa &quot;Tomar mesa&quot;.
        </p>
      ) : null}
    </div>
  );
}
