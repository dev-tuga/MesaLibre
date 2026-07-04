"use server";

import type { ActionResult } from "@/features/orders/schemas/order";

/** @deprecated Guests cannot self-order; use waiter actions instead. */
export async function addItemToOrder(_rawInput: unknown): Promise<ActionResult> {
  return { ok: false, error: "Solo el garzón puede agregar productos a la mesa." };
}

/** @deprecated Guests cannot modify the bill; use waiter actions instead. */
export async function removeOrderItem(_rawInput: unknown): Promise<ActionResult> {
  return { ok: false, error: "Solo el garzón puede modificar la cuenta." };
}
