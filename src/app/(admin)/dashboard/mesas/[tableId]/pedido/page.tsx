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
import { ClaimTableButton } from "@/features/staff/components/claim-table-button";
import { ReleaseTableButton } from "@/features/staff/components/release-table-button";
import { assertStaffTableAccess } from "@/features/staff/actions/table-service-actions";
import { getActiveTableService } from "@/features/staff/queries/table-service";
import { getStaffSession } from "@/features/staff/session";
import { staffRoleLabel } from "@/features/staff/labels";
import { getPublicBaseUrl } from "@/lib/app-url";
import { formatClp } from "@/lib/format";
import { canViewAllTables } from "@/lib/staff-auth";
import { buildTableUrl } from "@/lib/urls";

type PageProps = {
  params: Promise<{ tableId: string }>;
};

export const metadata: Metadata = {
  title: "Pedido de mesa",
};

export default async function WaiterOrderPage({ params }: PageProps) {
  const session = await getStaffSession();
  if (!session) redirect("/login");

  const { tableId } = await params;
  const isManager = canViewAllTables(session.user.role);

  const [context, menu, assignment, access] = await Promise.all([
    getWaiterOrderContext(tableId, session.user.restaurantId),
    getMenuForAdmin(session.user.restaurantId),
    getActiveTableService(tableId),
    isManager ? Promise.resolve({ ok: true as const }) : assertStaffTableAccess(tableId),
  ]);

  if (!context) notFound();

  const isMine = assignment?.staff.id === session.user.id;
  const needsClaim = !isManager && !assignment;
  const blocked = !isManager && assignment && !isMine;

  if (blocked) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/mesas">
            <ArrowLeft />
            Volver a mesas
          </Link>
        </Button>
        <div className="bg-card rounded-xl border p-6 text-center">
          <p className="font-medium">Mesa {context.table.number} atendida por otro garzón</p>
          <p className="text-muted-foreground mt-2 text-sm">
            {assignment?.staff.name} está a cargo de esta mesa.
          </p>
        </div>
      </div>
    );
  }

  const guestUrl = buildTableUrl(
    await getPublicBaseUrl(),
    context.table.restaurantSlug,
    context.table.qrToken,
  );
  const headCount = context.order?.headCount ?? 1;
  const frozen = context.order?.hasPayments ?? false;
  const canEdit = isManager || (access.ok && !needsClaim);

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Volver a mesas">
            <Link href="/dashboard/mesas">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mesa {context.table.number}</h1>
            <p className="text-muted-foreground text-sm">{context.table.restaurantName}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{staffRoleLabel(session.user.role)}</Badge>
          {assignment ? (
            <Badge variant="outline">{assignment.staff.name}</Badge>
          ) : (
            <Badge variant="outline">Sin asignar</Badge>
          )}
        </div>
      </div>

      {needsClaim ? (
        <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
          <p className="text-sm">Debes tomar esta mesa antes de cargar el pedido.</p>
          <ClaimTableButton tableId={tableId} label="Tomar esta mesa" />
        </div>
      ) : null}

      {isMine || isManager ? assignment ? <ReleaseTableButton tableId={tableId} /> : null : null}

      <HeadCountSelector
        tableId={context.table.id}
        value={headCount}
        disabled={frozen || !canEdit}
      />

      <Separator />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Cuenta actual</h2>
          <span className="text-lg font-bold tabular-nums">{formatClp(context.bill.totalClp)}</span>
        </div>
        <WaiterBillLines
          tableId={context.table.id}
          items={context.order?.items ?? []}
          editable={!frozen && canEdit}
        />
        {context.paidClp > 0 ? (
          <p className="text-muted-foreground text-sm">
            Ya pagado: {formatClp(context.paidClp)} · Queda {formatClp(context.remainingClp)}
          </p>
        ) : null}
      </section>

      <Separator />

      <WaiterMenuPicker
        tableId={context.table.id}
        categories={menu}
        disabled={frozen || !canEdit}
      />

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
