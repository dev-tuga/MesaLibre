"use server";

import { getTableByQrToken } from "@/features/menu/queries";
import type { ActionResult } from "@/features/orders/schemas/order";
import { submitReviewSchema } from "@/features/feedback/schemas/review";
import { canReviewOrder } from "@/features/feedback/services/review";
import { prisma } from "@/lib/prisma";

/** Persists the post-payment review of a paid order, once per order. */
export async function submitReview(rawInput: unknown): Promise<ActionResult> {
  const parsed = submitReviewSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos." };
  }
  const { slug, qrToken, orderId, rating, comment } = parsed.data;

  const table = await getTableByQrToken(slug, qrToken);
  if (!table) {
    return { ok: false, error: "Mesa no encontrada." };
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, tableId: table.id },
    include: { review: { select: { id: true } } },
  });
  if (!order) {
    return { ok: false, error: "Cuenta no encontrada." };
  }

  const eligibility = canReviewOrder(order);
  if (!eligibility.allowed) {
    return { ok: false, error: eligibility.reason };
  }

  try {
    await prisma.review.create({
      data: { orderId: order.id, rating, comment },
    });
  } catch {
    // Unique constraint on orderId: someone at the table beat us to it.
    return { ok: false, error: "Esta cuenta ya fue calificada." };
  }

  return { ok: true };
}
