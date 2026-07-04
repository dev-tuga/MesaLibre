"use server";

import { revalidatePath } from "next/cache";

import type { StaffActionResult } from "@/features/staff/schemas/staff";
import { getStaffSession } from "@/features/staff/session";
import { getPrisma } from "@/lib/prisma";

const DASHBOARD_PATHS = [
  "/dashboard",
  "/dashboard/mesas",
  "/dashboard/equipo",
  "/dashboard/desempeno",
];

function revalidateDashboard() {
  for (const path of DASHBOARD_PATHS) {
    revalidatePath(path);
  }
}

/** Starts a shift for the current waiter. Managers/owners may also track shifts. */
export async function startShift(): Promise<StaffActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Sesión expirada." };

  const prisma = getPrisma();
  const existing = await prisma.shift.findFirst({
    where: { staffUserId: session.user.id, endedAt: null },
  });
  if (existing) {
    return { ok: false, error: "Ya tienes un turno activo." };
  }

  await prisma.shift.create({
    data: {
      restaurantId: session.user.restaurantId,
      staffUserId: session.user.id,
    },
  });

  revalidateDashboard();
  return { ok: true };
}

/** Ends the active shift and releases all tables claimed by this waiter. */
export async function endShift(): Promise<StaffActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Sesión expirada." };

  const prisma = getPrisma();
  const shift = await prisma.shift.findFirst({
    where: { staffUserId: session.user.id, endedAt: null },
  });
  if (!shift) {
    return { ok: false, error: "No tienes un turno activo." };
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.shift.update({
      where: { id: shift.id },
      data: { endedAt: now },
    }),
    prisma.tableService.updateMany({
      where: { staffUserId: session.user.id, releasedAt: null },
      data: { releasedAt: now },
    }),
  ]);

  revalidateDashboard();
  return { ok: true };
}
