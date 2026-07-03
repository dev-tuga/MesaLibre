"use server";

import { revalidatePath } from "next/cache";

import { getTableByQrToken } from "@/features/menu/queries";
import { getOpenOrder, toBill } from "@/features/orders/queries";
import { getPaymentProvider } from "@/features/payments/providers";
import { payOrderSchema, type PayOrderResult } from "@/features/payments/schemas/payment";
import {
  buildPaymentQuote,
  isFullyPaid,
  remainingBalance,
} from "@/features/payments/services/quote";
import { prisma } from "@/lib/prisma";

function sumPaid(payments: { amountClp: number }[]): number {
  return payments.reduce((sum, p) => sum + p.amountClp, 0);
}

/**
 * Charges one share of the table's open bill (everything, or 1 of N parts
 * of what is left) plus the chosen tip. Amounts are always recomputed
 * server-side; the client's preview is never trusted. When the payment
 * settles the bill, the order is closed atomically with the payment record.
 */
export async function payOrder(rawInput: unknown): Promise<PayOrderResult> {
  const parsed = payOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos." };
  }
  const { slug, qrToken, splitCount, tip } = parsed.data;

  const table = await getTableByQrToken(slug, qrToken);
  if (!table) {
    return { ok: false, error: "Mesa no encontrada." };
  }

  const order = await getOpenOrder(table.id);
  if (!order || order.items.length === 0) {
    return { ok: false, error: "No hay una cuenta abierta para pagar." };
  }

  const payments = await prisma.payment.findMany({
    where: { orderId: order.id },
    select: { amountClp: true },
  });

  const totalClp = toBill(order).totalClp;
  const remainingClp = remainingBalance(totalClp, sumPaid(payments));
  if (remainingClp === 0) {
    return { ok: false, error: "La cuenta ya está pagada." };
  }

  let quote;
  try {
    quote = buildPaymentQuote({ remainingClp, splitCount, tip });
  } catch {
    return { ok: false, error: "No se pudo calcular el monto a pagar." };
  }

  const provider = getPaymentProvider();
  const charge = await provider.charge({
    amountClp: quote.amountClp,
    tipClp: quote.tipClp,
    description: `${table.restaurant.name} — Mesa ${table.number}`,
    metadata: { orderId: order.id, restaurantSlug: slug },
  });

  if (charge.status === "rejected") {
    return { ok: false, error: "El pago fue rechazado. Intenta de nuevo." };
  }

  const orderClosed = await prisma
    .$transaction(async (tx) => {
      // Re-check inside the transaction: someone else may have paid while
      // the provider round-trip was in flight.
      const currentPayments = await tx.payment.findMany({
        where: { orderId: order.id },
        select: { amountClp: true },
      });
      const currentRemaining = remainingBalance(totalClp, sumPaid(currentPayments));
      if (quote.amountClp > currentRemaining) {
        throw new Error("stale_balance");
      }

      await tx.payment.create({
        data: {
          orderId: order.id,
          amountClp: quote.amountClp,
          tipClp: quote.tipClp,
          method: "CARD",
          splitCount,
          providerRef: charge.providerRef,
        },
      });

      const paidAfter = sumPaid(currentPayments) + quote.amountClp;
      if (isFullyPaid(totalClp, paidAfter)) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PAID", closedAt: new Date() },
        });
        return true;
      }
      return false;
    })
    .catch((error: unknown) => {
      if (error instanceof Error && error.message === "stale_balance") {
        return null;
      }
      throw error;
    });

  if (orderClosed === null) {
    return {
      ok: false,
      error: "La cuenta cambió mientras pagabas. Revisa el saldo e intenta de nuevo.",
    };
  }

  const base = `/r/${slug}/${qrToken}`;
  for (const path of [base, `${base}/cuenta`, `${base}/cuenta/pagar`]) {
    revalidatePath(path);
  }

  return {
    ok: true,
    orderId: order.id,
    amountClp: quote.amountClp,
    tipClp: quote.tipClp,
    totalClp: quote.totalClp,
    orderClosed,
  };
}
