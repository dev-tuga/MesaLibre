"use server";

import { revalidatePath } from "next/cache";

import { getTableByQrToken } from "@/features/menu/queries";
import {
  addItemSchema,
  removeItemSchema,
  type ActionResult,
} from "@/features/orders/schemas/order";
import { prisma } from "@/lib/prisma";

function tablePaths(slug: string, qrToken: string): string[] {
  const base = `/r/${slug}/${qrToken}`;
  return [base, `${base}/cuenta`];
}

/**
 * Adds a product to the table's open order, creating the order if needed.
 * The product price is snapshotted into the order item; if the same product
 * (at the same price) is already on the bill, its quantity is incremented
 * instead of duplicating the line.
 */
export async function addItemToOrder(rawInput: unknown): Promise<ActionResult> {
  const parsed = addItemSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos." };
  }
  const { slug, qrToken, productId, quantity } = parsed.data;

  const table = await getTableByQrToken(slug, qrToken);
  if (!table) {
    return { ok: false, error: "Mesa no encontrada." };
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, available: true, category: { restaurantId: table.restaurantId } },
  });
  if (!product) {
    return { ok: false, error: "El producto ya no está disponible." };
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingOrder = await tx.order.findFirst({
      where: { tableId: table.id, status: "OPEN" },
      include: { payments: { select: { id: true }, take: 1 } },
    });

    // Once someone started paying, the bill is frozen: adding items would
    // change the balance under the payers' feet.
    if (existingOrder && existingOrder.payments.length > 0) {
      return { ok: false as const, error: "La cuenta ya está en proceso de pago." };
    }

    const order = existingOrder ?? (await tx.order.create({ data: { tableId: table.id } }));

    const existingItem = await tx.orderItem.findFirst({
      where: { orderId: order.id, productId: product.id, unitPriceClp: product.priceClp },
    });

    if (existingItem) {
      await tx.orderItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: quantity } },
      });
    } else {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity,
          unitPriceClp: product.priceClp,
        },
      });
    }
    return { ok: true as const };
  });

  if (!result.ok) {
    return result;
  }

  for (const path of tablePaths(slug, qrToken)) {
    revalidatePath(path);
  }
  return { ok: true };
}

/** Removes one line from the table's open order. Paid orders are immutable. */
export async function removeOrderItem(rawInput: unknown): Promise<ActionResult> {
  const parsed = removeItemSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos." };
  }
  const { slug, qrToken, orderItemId } = parsed.data;

  const table = await getTableByQrToken(slug, qrToken);
  if (!table) {
    return { ok: false, error: "Mesa no encontrada." };
  }

  const { count } = await prisma.orderItem.deleteMany({
    where: {
      id: orderItemId,
      order: { tableId: table.id, status: "OPEN", payments: { none: {} } },
    },
  });

  if (count === 0) {
    return { ok: false, error: "El ítem ya no se puede quitar de la cuenta." };
  }

  for (const path of tablePaths(slug, qrToken)) {
    revalidatePath(path);
  }
  return { ok: true };
}
