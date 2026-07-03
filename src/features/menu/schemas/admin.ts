import { z } from "zod";

export const MAX_PRICE_CLP = 10_000_000;

export const upsertCategorySchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(60),
});

export const deleteCategorySchema = z.object({
  id: z.string().min(1),
});

export const upsertProductSchema = z.object({
  id: z.string().min(1).optional(),
  categoryId: z.string().min(1),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  description: z
    .string()
    .trim()
    .max(200)
    .transform((value) => (value.length > 0 ? value : null))
    .nullish(),
  priceClp: z
    .number()
    .int("El precio debe ser un monto en pesos, sin decimales")
    .min(0)
    .max(MAX_PRICE_CLP),
  available: z.boolean().default(true),
});

export const deleteProductSchema = z.object({
  id: z.string().min(1),
});

export const toggleProductSchema = z.object({
  id: z.string().min(1),
  available: z.boolean(),
});

export type UpsertCategoryInput = z.infer<typeof upsertCategorySchema>;
export type UpsertProductInput = z.infer<typeof upsertProductSchema>;
