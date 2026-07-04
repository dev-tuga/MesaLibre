import { z } from "zod";

export const MAX_HEAD_COUNT = 20;

export const setHeadCountSchema = z.object({
  tableId: z.string().min(1),
  headCount: z.number().int().min(1).max(MAX_HEAD_COUNT),
});

export const waiterAddItemSchema = z.object({
  tableId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50).default(1),
});

export const waiterRemoveItemSchema = z.object({
  tableId: z.string().min(1),
  orderItemId: z.string().min(1),
});
