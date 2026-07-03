import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PrintButton } from "@/features/tables/components/print-button";
import { TableQr } from "@/features/tables/components/table-qr";
import { getTablesForAdmin } from "@/features/tables/queries";
import { getAdminSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { buildTableUrl } from "@/lib/urls";

export const metadata: Metadata = {
  title: "QR de mesas",
};

export default async function TableQrSheetPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login");

  const tables = await getTablesForAdmin(session.user.restaurantId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Volver a mesas">
            <Link href="/dashboard/mesas">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">QR de mesas</h1>
            <p className="text-muted-foreground text-sm">
              Imprime esta hoja, recorta cada tarjeta y pégala en su mesa.
            </p>
          </div>
        </div>
        <PrintButton />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2 print:gap-6">
        {tables.map((table) => {
          const url = buildTableUrl(
            env.NEXT_PUBLIC_APP_BASE_URL,
            table.restaurant.slug,
            table.qrToken,
          );
          return (
            <div
              key={table.id}
              className="bg-card flex flex-col items-center gap-3 rounded-xl border p-6 text-center print:break-inside-avoid print:rounded-none print:border-dashed"
            >
              <p className="text-muted-foreground text-sm font-medium">{table.restaurant.name}</p>
              <p className="text-2xl font-bold">Mesa {table.number}</p>
              <TableQr url={url} className="w-40 print:w-48 [&_svg]:h-auto [&_svg]:w-full" />
              <p className="text-muted-foreground text-xs">
                Escanea para ver la carta y pagar tu cuenta
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
