"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/features/orders/schemas/order";
import { regenerateQrTokenSchema } from "@/features/tables/schemas/table";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** 12 random bytes -> 16 url-safe chars; plenty of entropy for a table token. */
function newQrToken(): string {
  return randomBytes(12).toString("base64url");
}

/**
 * Replaces a table's QR token. The previous printed QR stops resolving
 * immediately — this is the escape hatch when a token leaks or a printed
 * sheet goes missing.
 */
export async function regenerateQrToken(rawInput: unknown): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesión expirada." };

  const parsed = regenerateQrTokenSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const { count } = await prisma.table.updateMany({
    where: { id: parsed.data.tableId, restaurantId: session.user.restaurantId },
    data: { qrToken: newQrToken() },
  });
  if (count === 0) return { ok: false, error: "Mesa no encontrada." };

  revalidatePath("/dashboard/mesas");
  revalidatePath("/dashboard/mesas/qr");
  return { ok: true };
}
