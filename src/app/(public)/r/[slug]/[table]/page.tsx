import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { CategoryNav } from "@/features/menu/components/category-nav";
import { MenuSections } from "@/features/menu/components/menu-sections";
import { getMenu, getTableByQrToken } from "@/features/menu/queries";
import { tableRouteParamsSchema } from "@/features/menu/schemas/route-params";
import { AddToOrderButton } from "@/features/orders/components/add-to-order-button";
import { BillBar } from "@/features/orders/components/bill-bar";
import { getOpenOrder, toBill } from "@/features/orders/queries";

type PageProps = {
  params: Promise<{ slug: string; table: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const parsed = tableRouteParamsSchema.safeParse(await params);
  if (!parsed.success) return {};

  const table = await getTableByQrToken(parsed.data.slug, parsed.data.table);
  if (!table) return {};

  return {
    title: `${table.restaurant.name} — Mesa ${table.number}`,
  };
}

export default async function TableMenuPage({ params }: PageProps) {
  const parsed = tableRouteParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();

  const table = await getTableByQrToken(parsed.data.slug, parsed.data.table);
  if (!table) notFound();

  const [categories, order] = await Promise.all([
    getMenu(table.restaurantId),
    getOpenOrder(table.id),
  ]);
  const bill = toBill(order);

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-28">
      <header className="flex items-center justify-between gap-3 py-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{table.restaurant.name}</h1>
          <p className="text-muted-foreground text-sm">Carta digital</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Mesa {table.number}
        </Badge>
      </header>

      {categories.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-xl border p-6 text-center">
          Este restaurante todavía no publica su carta.
        </p>
      ) : (
        <>
          <CategoryNav categories={categories} />
          <div className="mt-6">
            <MenuSections
              categories={categories}
              productAction={(product) => (
                <AddToOrderButton
                  slug={parsed.data.slug}
                  qrToken={parsed.data.table}
                  productId={product.id}
                  productName={product.name}
                />
              )}
            />
          </div>
        </>
      )}

      <BillBar slug={parsed.data.slug} qrToken={parsed.data.table} bill={bill} />
    </main>
  );
}
