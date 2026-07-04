"use server";

import { revalidatePath } from "next/cache";

import {
  deleteCategorySchema,
  deleteProductSchema,
  toggleProductSchema,
  upsertCategorySchema,
  upsertProductSchema,
} from "@/features/menu/schemas/admin";
import type { ActionResult } from "@/features/orders/schemas/order";
import { getAdminSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

const MENU_PATH = "/dashboard/carta";

/**
 * Every admin action re-checks the session and scopes queries to the
 * admin's restaurant, so one restaurant can never touch another's menu.
 */

export async function upsertCategory(rawInput: unknown): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesión expirada." };

  const parsed = upsertCategorySchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const { id, name } = parsed.data;
  const restaurantId = session.user.restaurantId;
  const prisma = getPrisma();

  try {
    if (id) {
      const { count } = await prisma.category.updateMany({
        where: { id, restaurantId },
        data: { name },
      });
      if (count === 0) return { ok: false, error: "Categoría no encontrada." };
    } else {
      const last = await prisma.category.findFirst({
        where: { restaurantId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      await prisma.category.create({
        data: { restaurantId, name, position: (last?.position ?? -1) + 1 },
      });
    }
  } catch {
    return { ok: false, error: "Ya existe una categoría con ese nombre." };
  }

  revalidatePath(MENU_PATH);
  return { ok: true };
}

export async function deleteCategory(rawInput: unknown): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesión expirada." };

  const parsed = deleteCategorySchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const prisma = getPrisma();
  const category = await prisma.category.findFirst({
    where: { id: parsed.data.id, restaurantId: session.user.restaurantId },
    include: { products: { select: { _count: { select: { orderItems: true } } } } },
  });
  if (!category) return { ok: false, error: "Categoría no encontrada." };

  const hasSales = category.products.some((p) => p._count.orderItems > 0);
  if (hasSales) {
    return {
      ok: false,
      error: "La categoría tiene productos con ventas registradas. Márcalos como no disponibles.",
    };
  }

  await prisma.category.delete({ where: { id: category.id } });

  revalidatePath(MENU_PATH);
  return { ok: true };
}

export async function upsertProduct(rawInput: unknown): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesión expirada." };

  const parsed = upsertProductSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const { id, categoryId, name, description, priceClp, available } = parsed.data;
  const restaurantId = session.user.restaurantId;
  const prisma = getPrisma();

  const category = await prisma.category.findFirst({
    where: { id: categoryId, restaurantId },
    select: { id: true },
  });
  if (!category) return { ok: false, error: "Categoría no encontrada." };

  if (id) {
    const { count } = await prisma.product.updateMany({
      where: { id, category: { restaurantId } },
      data: { categoryId, name, description, priceClp, available },
    });
    if (count === 0) return { ok: false, error: "Producto no encontrado." };
  } else {
    const last = await prisma.product.findFirst({
      where: { categoryId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    await prisma.product.create({
      data: {
        categoryId,
        name,
        description,
        priceClp,
        available,
        position: (last?.position ?? -1) + 1,
      },
    });
  }

  revalidatePath(MENU_PATH);
  return { ok: true };
}

export async function toggleProductAvailability(rawInput: unknown): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesión expirada." };

  const parsed = toggleProductSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const prisma = getPrisma();
  const { count } = await prisma.product.updateMany({
    where: { id: parsed.data.id, category: { restaurantId: session.user.restaurantId } },
    data: { available: parsed.data.available },
  });
  if (count === 0) return { ok: false, error: "Producto no encontrado." };

  revalidatePath(MENU_PATH);
  return { ok: true };
}

export async function deleteProduct(rawInput: unknown): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesión expirada." };

  const parsed = deleteProductSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const prisma = getPrisma();
  const product = await prisma.product.findFirst({
    where: { id: parsed.data.id, category: { restaurantId: session.user.restaurantId } },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!product) return { ok: false, error: "Producto no encontrado." };

  if (product._count.orderItems > 0) {
    return {
      ok: false,
      error: "El producto tiene ventas registradas: márcalo como no disponible en vez de borrarlo.",
    };
  }

  await prisma.product.delete({ where: { id: product.id } });

  revalidatePath(MENU_PATH);
  return { ok: true };
}
