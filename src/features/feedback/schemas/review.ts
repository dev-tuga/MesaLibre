import { z } from "zod";

import { tableIdentitySchema } from "@/features/orders/schemas/order";
import { MAX_RATING, MIN_RATING } from "@/features/feedback/services/review";

export const MAX_COMMENT_LENGTH = 500;

export const submitReviewSchema = tableIdentitySchema.extend({
  orderId: z.string().min(1),
  rating: z.number().int().min(MIN_RATING).max(MAX_RATING),
  comment: z
    .string()
    .trim()
    .max(MAX_COMMENT_LENGTH)
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional(),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
