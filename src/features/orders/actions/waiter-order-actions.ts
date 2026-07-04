"use server";

import { revalidatePath } from "next/cache";

import { assertStaffTableAccess } from "@/features/staff/actions/table-service-actions";
import { getActiveShift } from "@/features/staff/queries/shift";
import { getActiveTableService } from "@/features/staff/queries/table-service";
import { getStaffSession } from "@/features/staff/session";
import type { ActionResult } from "@/features/orders/schemas/order";
import {
  setHeadCountSchema,
  waiterAddItemSchema,
  waiterRemoveItemSchema,
} from "@/features/orders/schemas/waiter-order";
import { getPrisma } from "@/lib/prisma";
import { canViewAllTables } from "@/lib/staff-auth";

function orderPaths(tableId: string): string[] {
  return [`/dashboard/mesas/${tableId}/pedido`, "/dashboard/mesas"];
}

async function assertTableAccess(tableId: string, restaurantId: string) {
  const prisma = getPrisma();
  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurantId },
    select: { id: true },
  });
  return table;
}

async function getOrderStaffContext(tableId: string, staffUserId: string, role: string) {
  if (canViewAllTables(role as "OWNER" | "MANAGER" | "WAITER")) {
    const assignment = await getActiveTableService(tableId);
    const shift = await getActiveShift(staffUserId);
    return {
      servedByStaffId: assignment?.staffUserId ?? staffUserId,
      shiftId: shift?.id ?? null,
      addedByStaffId: staffUserId,
    };
  }

  const access = await assertStaffTableAccess(tableId);
  if (!access.ok) return null;

  const shift = await getActiveShift(staffUserId);
  if (!shift) return null;

  return {
    servedByStaffId: staffUserId,
    shiftId: shift.id,
    addedByStaffId: staffUserId,
  };
}

/** Opens an order for the table if needed and records how many diners are seated. */
export async function setTableHeadCount(rawInput: unknown): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Sesión expirada." };

  const parsed = setHeadCountSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const table = await assertTableAccess(parsed.data.tableId, session.user.restaurantId);
  if (!table) return { ok: false, error: "Mesa no encontrada." };

  const staffContext = await getOrderStaffContext(
    parsed.data.tableId,
    session.user.id,
    session.user.role,
  );
  if (!staffContext) {
    return { ok: false, error: "Debes tomar la mesa e iniciar turno para cargar el pedido." };
  }

  const prisma = getPrisma();
  const existing = await prisma.order.findFirst({
    where: { tableId: parsed.data.tableId, status: "OPEN" },
    include: { payments: { select: { id: true }, take: 1 } },
  });

  if (existing?.payments.length) {
    return { ok: false, error: "No se puede cambiar el número de comensales durante el pago." };
  }

  if (existing) {
    await prisma.order.update({
      where: { id: existing.id },
      data: {
        headCount: parsed.data.headCount,
        servedByStaffId: existing.servedByStaffId ?? staffContext.servedByStaffId,
        shiftId: existing.shiftId ?? staffContext.shiftId,
      },
    });
  } else {
    await prisma.order.create({
      data: {
        tableId: parsed.data.tableId,
        headCount: parsed.data.headCount,
        servedByStaffId: staffContext.servedByStaffId,
        shiftId: staffContext.shiftId,
      },
    });
  }

  const openOrder = await prisma.order.findFirst({
    where: { tableId: parsed.data.tableId, status: "OPEN" },
    select: { id: true },
  });
  if (openOrder) {
    await prisma.tableService.updateMany({
      where: {
        tableId: parsed.data.tableId,
        releasedAt: null,
        orderId: null,
      },
      data: { orderId: openOrder.id },
    });
  }

  for (const path of orderPaths(parsed.data.tableId)) {
    revalidatePath(path);
  }
  return { ok: true };
}

/** Staff adds a product to the table's open order (guests cannot self-order). */
export async function waiterAddItemToOrder(rawInput: unknown): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Sesión expirada." };

  const parsed = waiterAddItemSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const table = await assertTableAccess(parsed.data.tableId, session.user.restaurantId);
  if (!table) return { ok: false, error: "Mesa no encontrada." };

  const staffContext = await getOrderStaffContext(
    parsed.data.tableId,
    session.user.id,
    session.user.role,
  );
  if (!staffContext) {
    return { ok: false, error: "Debes tomar la mesa e iniciar turno para cargar el pedido." };
  }

  const prisma = getPrisma();
  const product = await prisma.product.findFirst({
    where: {
      id: parsed.data.productId,
      available: true,
      category: { restaurantId: session.user.restaurantId },
    },
  });
  if (!product) return { ok: false, error: "El producto ya no está disponible." };

  const result = await prisma.$transaction(async (tx) => {
    let order = await tx.order.findFirst({
      where: { tableId: parsed.data.tableId, status: "OPEN" },
      include: { payments: { select: { id: true }, take: 1 } },
    });

    if (order?.payments.length) {
      return { ok: false as const, error: "La cuenta ya está en proceso de pago." };
    }

    if (!order) {
      order = await tx.order.create({
        data: {
          tableId: parsed.data.tableId,
          headCount: 1,
          servedByStaffId: staffContext.servedByStaffId,
          shiftId: staffContext.shiftId,
        },
        include: { payments: { select: { id: true }, take: 1 } },
      });

      await tx.tableService.updateMany({
        where: { tableId: parsed.data.tableId, releasedAt: null, orderId: null },
        data: { orderId: order.id },
      });
    } else if (!order.servedByStaffId) {
      await tx.order.update({
        where: { id: order.id },
        data: {
          servedByStaffId: staffContext.servedByStaffId,
          shiftId: staffContext.shiftId,
        },
      });
    }

    const existingItem = await tx.orderItem.findFirst({
      where: {
        orderId: order.id,
        productId: product.id,
        unitPriceClp: product.priceClp,
      },
    });

    if (existingItem) {
      await tx.orderItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: parsed.data.quantity } },
      });
    } else {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: parsed.data.quantity,
          unitPriceClp: product.priceClp,
          addedByStaffId: staffContext.addedByStaffId,
        },
      });
    }
    return { ok: true as const };
  });

  if (!result.ok) return result;

  for (const path of orderPaths(parsed.data.tableId)) {
    revalidatePath(path);
  }
  return { ok: true };
}

/** Staff removes a line from the table's open order. */
export async function waiterRemoveOrderItem(rawInput: unknown): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Sesión expirada." };

  const parsed = waiterRemoveItemSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const staffContext = await getOrderStaffContext(
    parsed.data.tableId,
    session.user.id,
    session.user.role,
  );
  if (!staffContext) {
    return { ok: false, error: "Debes tomar la mesa e iniciar turno para editar el pedido." };
  }

  const prisma = getPrisma();
  const { count } = await prisma.orderItem.deleteMany({
    where: {
      id: parsed.data.orderItemId,
      order: {
        tableId: parsed.data.tableId,
        status: "OPEN",
        table: { restaurantId: session.user.restaurantId },
        payments: { none: {} },
      },
    },
  });

  if (count === 0) {
    return { ok: false, error: "El ítem ya no se puede quitar de la cuenta." };
  }

  for (const path of orderPaths(parsed.data.tableId)) {
    revalidatePath(path);
  }
  return { ok: true };
}
