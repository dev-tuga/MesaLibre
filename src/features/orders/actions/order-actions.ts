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

  await prisma.$transaction(async (tx) => {
    const order =
      (await tx.order.findFirst({ where: { tableId: table.id, status: "OPEN" } })) ??
      (await tx.order.create({ data: { tableId: table.id } }));

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
  });

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
      order: { tableId: table.id, status: "OPEN" },
    },
  });

  if (count === 0) {
    return { ok: false, error: "El ítem ya no está en la cuenta." };
  }

  for (const path of tablePaths(slug, qrToken)) {
    revalidatePath(path);
  }
  return { ok: true };
}
