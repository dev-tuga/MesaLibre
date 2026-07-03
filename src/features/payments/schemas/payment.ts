import { z } from "zod";

import { tableIdentitySchema } from "@/features/orders/schemas/order";
import { TIP_PERCENT_OPTIONS } from "@/features/payments/services/tip";

export const MAX_SPLIT_COUNT = 12;
/** Sanity cap so a typo in the custom tip field cannot charge a fortune. */
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

export const payOrderSchema = tableIdentitySchema.extend({
  splitCount: z.number().int().min(1).max(MAX_SPLIT_COUNT),
  tip: tipChoiceSchema,
});

export type PayOrderInput = z.infer<typeof payOrderSchema>;

export type PayOrderResult =
  | {
      ok: true;
      orderId: string;
      amountClp: number;
      tipClp: number;
      totalClp: number;
      /** True when this payment settled the bill and closed the order. */
      orderClosed: boolean;
    }
  | { ok: false; error: string };
