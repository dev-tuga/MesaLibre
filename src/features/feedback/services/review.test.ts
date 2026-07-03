import { describe, expect, it } from "vitest";

import { canReviewOrder, isValidRating } from "./review";

describe("canReviewOrder", () => {
  it("allows reviewing a paid order without a review", () => {
    expect(canReviewOrder({ status: "PAID", review: null })).toEqual({ allowed: true });
  });

  it("rejects open orders", () => {
    const result = canReviewOrder({ status: "OPEN", review: null });
    expect(result.allowed).toBe(false);
  });

  it("rejects orders that were already reviewed", () => {
    const result = canReviewOrder({ status: "PAID", review: { id: "r1" } });
    expect(result.allowed).toBe(false);
  });
});

describe("isValidRating", () => {
  it("accepts whole stars from 1 to 5", () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      expect(isValidRating(rating)).toBe(true);
    }
  });

  it("rejects out-of-range and fractional ratings", () => {
    for (const rating of [0, 6, -1, 3.5, Number.NaN]) {
      expect(isValidRating(rating)).toBe(false);
    }
  });
});
