import { z } from "zod";

/** A guest is identified only by the table's QR token plus the restaurant slug. */
export const tableIdentitySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  qrToken: z.string().min(1).max(100),
});

export const addItemSchema = tableIdentitySchema.extend({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50).default(1),
});

export const removeItemSchema = tableIdentitySchema.extend({
  orderItemId: z.string().min(1),
});

export type AddItemInput = z.infer<typeof addItemSchema>;
export type RemoveItemInput = z.infer<typeof removeItemSchema>;

/** Uniform result shape returned by order-related server actions. */
export type ActionResult = { ok: true } | { ok: false; error: string };
