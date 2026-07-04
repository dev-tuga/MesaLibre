"use server";

import { releaseTableForOrder } from "@/features/staff/actions/table-service-actions";
import { getTableByQrToken } from "@/features/menu/queries";
import { getOpenOrder, toBill } from "@/features/orders/queries";
import { getPaymentProvider } from "@/features/payments/providers";
import { payOrderSchema, type PayOrderResult } from "@/features/payments/schemas/payment";
import {
  computeBillLineAvailability,
  type ItemSelection,
} from "@/features/payments/services/item-allocation";
import {
  buildItemPaymentQuote,
  buildPaymentQuote,
  isFullyPaid,
  remainingBalance,
} from "@/features/payments/services/quote";
import { getPrisma } from "@/lib/prisma";

function sumPaid(payments: { amountClp: number }[]): number {
  return payments.reduce((sum, p) => sum + p.amountClp, 0);
}

function flattenAllocations(
  payments: { itemAllocations: { orderItemId: string; quantity: number }[] }[],
) {
  return payments.flatMap((payment) => payment.itemAllocations);
}

export async function payOrder(rawInput: unknown): Promise<PayOrderResult> {
  const parsed = payOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos." };
  }

  const { slug, qrToken, tip, method } = parsed.data;
  const table = await getTableByQrToken(slug, qrToken);
  if (!table) {
    return { ok: false, error: "Mesa no encontrada." };
  }

  const order = await getOpenOrder(table.id);
  if (!order || order.items.length === 0) {
    return { ok: false, error: "No hay una cuenta abierta para pagar." };
  }

  const prisma = getPrisma();
  const payments = await prisma.payment.findMany({
    where: { orderId: order.id },
    select: { amountClp: true },
  });

  const totalClp = toBill(order).totalClp;
  const remainingClp = remainingBalance(totalClp, sumPaid(payments));
  if (remainingClp === 0) {
    return { ok: false, error: "La cuenta ya está pagada." };
  }

  const lineAvailability = computeBillLineAvailability(
    order.items,
    flattenAllocations(order.payments),
  );

  let quote;
  let splitMode: "EQUAL" | "BY_ITEMS";
  let splitCount = 1;
  let selections: ItemSelection[] = [];

  try {
    if (parsed.data.splitMode === "EQUAL") {
      splitMode = "EQUAL";
      splitCount = parsed.data.splitCount;
      quote = buildPaymentQuote({ remainingClp, splitCount, tip });
    } else {
      splitMode = "BY_ITEMS";
      selections = parsed.data.selections;
      quote = buildItemPaymentQuote({
        lines: lineAvailability,
        selections,
        tip,
      });
      if (quote.amountClp > remainingClp) {
        return { ok: false, error: "La selección supera el saldo pendiente." };
      }
    }
  } catch {
    return { ok: false, error: "No se pudo calcular el monto a pagar." };
  }

  const provider = getPaymentProvider();
  const charge = await provider.charge({
    amountClp: quote.amountClp,
    tipClp: quote.tipClp,
    method,
    description: `${table.restaurant.name} — Mesa ${table.number}`,
    metadata: { orderId: order.id, restaurantSlug: slug },
  });

  if (charge.status === "rejected") {
    return { ok: false, error: "El pago fue rechazado. Intenta de nuevo." };
  }

  const orderClosed = await prisma
    .$transaction(async (tx) => {
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
          method,
          splitMode,
          splitCount,
          providerRef: charge.providerRef,
          itemAllocations:
            splitMode === "BY_ITEMS"
              ? {
                  create: selections.map((selection) => {
                    const line = lineAvailability.find(
                      (row) => row.orderItemId === selection.orderItemId,
                    )!;
                    return {
                      orderItemId: selection.orderItemId,
                      quantity: selection.quantity,
                      amountClp: line.unitPriceClp * selection.quantity,
                    };
                  }),
                }
              : undefined,
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

  if (orderClosed) {
    await releaseTableForOrder(order.id);
  }

  return {
    ok: true,
    orderId: order.id,
    amountClp: quote.amountClp,
    tipClp: quote.tipClp,
    totalClp: quote.totalClp,
    orderClosed,
    method,
  };
}
