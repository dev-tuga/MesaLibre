"use server";

import { revalidatePath } from "next/cache";

import {
  assignTableSchema,
  claimTableSchema,
  releaseTableSchema,
  reassignTableSchema,
  type StaffActionResult,
} from "@/features/staff/schemas/staff";
import { getActiveShift } from "@/features/staff/queries/shift";
import { getStaffSession } from "@/features/staff/session";
import { getPrisma } from "@/lib/prisma";
import { canManageStaff, canViewAllTables, isManagerOrOwner } from "@/lib/staff-auth";

function revalidateTablePaths(tableId: string) {
  revalidatePath("/dashboard/mesas");
  revalidatePath(`/dashboard/mesas/${tableId}/pedido`);
}

async function assertTableInRestaurant(tableId: string, restaurantId: string) {
  const prisma = getPrisma();
  return prisma.table.findFirst({
    where: { id: tableId, restaurantId },
    select: { id: true },
  });
}

/** Waiter claims an unassigned table during their active shift. */
export async function claimTable(rawInput: unknown): Promise<StaffActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Sesión expirada." };

  const parsed = claimTableSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const table = await assertTableInRestaurant(parsed.data.tableId, session.user.restaurantId);
  if (!table) return { ok: false, error: "Mesa no encontrada." };

  if (isManagerOrOwner(session.user.role)) {
    return assignTableInternal(session, parsed.data.tableId, session.user.id, "SELF_CLAIMED");
  }

  const shift = await getActiveShift(session.user.id);
  if (!shift) {
    return { ok: false, error: "Inicia tu turno antes de tomar una mesa." };
  }

  return assignTableInternal(
    session,
    parsed.data.tableId,
    session.user.id,
    "SELF_CLAIMED",
    shift.id,
  );
}

/** Manager assigns a table to a specific waiter. */
export async function assignTable(rawInput: unknown): Promise<StaffActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Sesión expirada." };
  if (!canManageStaff(session.user.role)) {
    return { ok: false, error: "No tienes permiso para asignar mesas." };
  }

  const parsed = assignTableSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const prisma = getPrisma();
  const target = await prisma.adminUser.findFirst({
    where: {
      id: parsed.data.staffUserId,
      restaurantId: session.user.restaurantId,
      isActive: true,
    },
  });
  if (!target) return { ok: false, error: "Garzón no encontrado." };

  const shift = await getActiveShift(target.id);
  return assignTableInternal(
    session,
    parsed.data.tableId,
    target.id,
    "ASSIGNED",
    shift?.id ?? null,
  );
}

/** Manager reassigns a table from one waiter to another. */
export async function reassignTable(rawInput: unknown): Promise<StaffActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Sesión expirada." };
  if (!canManageStaff(session.user.role)) {
    return { ok: false, error: "No tienes permiso para reasignar mesas." };
  }

  const parsed = reassignTableSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const prisma = getPrisma();
  const active = await prisma.tableService.findFirst({
    where: {
      tableId: parsed.data.tableId,
      restaurantId: session.user.restaurantId,
      releasedAt: null,
    },
  });

  if (active) {
    await prisma.tableService.update({
      where: { id: active.id },
      data: { releasedAt: new Date() },
    });
  }

  return assignTable({
    tableId: parsed.data.tableId,
    staffUserId: parsed.data.staffUserId,
  });
}

/** Releases a table assignment (waiter or manager). */
export async function releaseTable(rawInput: unknown): Promise<StaffActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Sesión expirada." };

  const parsed = releaseTableSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const prisma = getPrisma();
  const active = await prisma.tableService.findFirst({
    where: {
      tableId: parsed.data.tableId,
      restaurantId: session.user.restaurantId,
      releasedAt: null,
    },
  });

  if (!active) {
    return { ok: false, error: "Esta mesa no está asignada." };
  }

  const canRelease = canManageStaff(session.user.role) || active.staffUserId === session.user.id;
  if (!canRelease) {
    return { ok: false, error: "No puedes liberar una mesa de otro garzón." };
  }

  await prisma.tableService.update({
    where: { id: active.id },
    data: { releasedAt: new Date() },
  });

  revalidateTablePaths(parsed.data.tableId);
  return { ok: true };
}

async function assignTableInternal(
  session: NonNullable<Awaited<ReturnType<typeof getStaffSession>>>,
  tableId: string,
  staffUserId: string,
  claimMode: "ASSIGNED" | "SELF_CLAIMED",
  shiftId: string | null = null,
): Promise<StaffActionResult> {
  const table = await assertTableInRestaurant(tableId, session.user.restaurantId);
  if (!table) return { ok: false, error: "Mesa no encontrada." };

  const prisma = getPrisma();
  const existing = await prisma.tableService.findFirst({
    where: { tableId, releasedAt: null },
  });

  if (existing) {
    if (existing.staffUserId === staffUserId) {
      return { ok: true };
    }
    return { ok: false, error: "Esta mesa ya está siendo atendida por otro garzón." };
  }

  const openOrder = await prisma.order.findFirst({
    where: { tableId, status: "OPEN" },
    select: { id: true },
  });

  await prisma.tableService.create({
    data: {
      restaurantId: session.user.restaurantId,
      tableId,
      staffUserId,
      orderId: openOrder?.id ?? null,
      shiftId,
      claimMode,
    },
  });

  if (openOrder) {
    await prisma.order.update({
      where: { id: openOrder.id },
      data: {
        servedByStaffId: staffUserId,
        ...(shiftId ? { shiftId } : {}),
      },
    });
  }

  revalidateTablePaths(tableId);
  return { ok: true };
}

/**
 * Returns whether the current staff member may operate on a table.
 * Managers/owners always can; waiters only on their claimed tables.
 */
export async function assertStaffTableAccess(tableId: string): Promise<StaffActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Sesión expirada." };

  if (canViewAllTables(session.user.role)) {
    return { ok: true };
  }

  const prisma = getPrisma();
  const assignment = await prisma.tableService.findFirst({
    where: {
      tableId,
      staffUserId: session.user.id,
      releasedAt: null,
      restaurantId: session.user.restaurantId,
    },
  });

  if (!assignment) {
    return { ok: false, error: "Debes tomar esta mesa antes de cargar el pedido." };
  }

  const shift = await getActiveShift(session.user.id);
  if (!shift) {
    return { ok: false, error: "Inicia tu turno para atender mesas." };
  }

  return { ok: true };
}

/** Releases table service when an order is fully paid. */
export async function releaseTableForOrder(orderId: string) {
  const prisma = getPrisma();
  const now = new Date();
  await prisma.tableService.updateMany({
    where: { orderId, releasedAt: null },
    data: { releasedAt: now },
  });
}
