import { z } from "zod";

import { tableIdentitySchema } from "@/features/orders/schemas/order";
import { TIP_PERCENT_OPTIONS } from "@/features/payments/services/tip";

export const MAX_SPLIT_COUNT = 20;
export const MAX_CUSTOM_TIP_CLP = 500_000;

const tipChoiceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("percent"),
    percent: z.union(TIP_PERCENT_OPTIONS.map((p) => z.literal(p))),
  }),
  z.object({
    type: z.literal("custom"),
    amountClp: z.number().int().min(0).max(MAX_CUSTOM_TIP_CLP),
  }),
]);

const paymentMethodSchema = z.enum(["CARD", "APPLE_PAY", "GOOGLE_PAY"]);

const itemSelectionSchema = z.object({
  orderItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
});

const equalSplitSchema = tableIdentitySchema.extend({
  splitMode: z.literal("EQUAL"),
  splitCount: z.number().int().min(1).max(MAX_SPLIT_COUNT),
  tip: tipChoiceSchema,
  method: paymentMethodSchema.default("CARD"),
});

const byItemsSplitSchema = tableIdentitySchema.extend({
  splitMode: z.literal("BY_ITEMS"),
  selections: z.array(itemSelectionSchema).min(1),
  tip: tipChoiceSchema,
  method: paymentMethodSchema.default("CARD"),
});

export const payOrderSchema = z.discriminatedUnion("splitMode", [
  equalSplitSchema,
  byItemsSplitSchema,
]);

export type PayOrderInput = z.infer<typeof payOrderSchema>;

export type PayOrderResult =
  | {
      ok: true;
      orderId: string;
      amountClp: number;
      tipClp: number;
      totalClp: number;
      orderClosed: boolean;
      method: z.infer<typeof paymentMethodSchema>;
    }
  | { ok: false; error: string };
