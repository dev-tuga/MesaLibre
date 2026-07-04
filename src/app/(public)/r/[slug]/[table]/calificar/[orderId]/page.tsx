import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/features/feedback/components/review-form";
import { canReviewOrder } from "@/features/feedback/services/review";
import { getTableByQrToken } from "@/features/menu/queries";
import { tableRouteParamsSchema } from "@/features/menu/schemas/route-params";
import { getPrisma } from "@/lib/prisma";

const paramsSchema = tableRouteParamsSchema.extend({
  orderId: z.string().min(1).max(100),
});

type PageProps = {
  params: Promise<{ slug: string; table: string; orderId: string }>;
};

export const metadata: Metadata = {
  title: "Califica tu visita",
};

export default async function ReviewPage({ params }: PageProps) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) notFound();

  const table = await getTableByQrToken(parsed.data.slug, parsed.data.table);
  if (!table) notFound();

  const prisma = getPrisma();
  const order = await prisma.order.findFirst({
    where: { id: parsed.data.orderId, tableId: table.id },
    include: { review: { select: { id: true } } },
  });
  if (!order) notFound();

  const eligibility = canReviewOrder(order);

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-16">
      <header className="flex items-center justify-between gap-3 py-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Califica tu visita</h1>
          <p className="text-muted-foreground text-sm">{table.restaurant.name}</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Mesa {table.number}
        </Badge>
      </header>

      {eligibility.allowed ? (
        <ReviewForm slug={parsed.data.slug} qrToken={parsed.data.table} orderId={order.id} />
      ) : (
        <div className="bg-card space-y-4 rounded-xl border p-6 text-center">
          <p className="text-muted-foreground">{eligibility.reason}</p>
          <Button asChild variant="outline">
            <Link href={`/r/${parsed.data.slug}/${parsed.data.table}`}>Volver a la carta</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
