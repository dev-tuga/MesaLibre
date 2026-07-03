export const MIN_RATING = 1;
export const MAX_RATING = 5;

type ReviewableOrder = {
  status: "OPEN" | "PAID";
  review: { id: string } | null;
};

export type ReviewEligibility = { allowed: true } | { allowed: false; reason: string };

/**
 * An order can be reviewed exactly once, and only after the bill was
 * settled — feedback is about the full visit, not a half-paid table.
 */
export function canReviewOrder(order: ReviewableOrder): ReviewEligibility {
  if (order.status !== "PAID") {
    return { allowed: false, reason: "La cuenta todavía no está pagada." };
  }
  if (order.review) {
    return { allowed: false, reason: "Esta cuenta ya fue calificada." };
  }
  return { allowed: true };
}

export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= MIN_RATING && rating <= MAX_RATING;
}
