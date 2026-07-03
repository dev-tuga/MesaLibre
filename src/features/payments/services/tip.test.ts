import { describe, expect, it } from "vitest";

import { calculateTipFromPercent } from "./tip";

describe("calculateTipFromPercent", () => {
  it("computes the customary chilean 10%", () => {
    expect(calculateTipFromPercent(12990, 10)).toBe(1299);
  });

  it("computes 15%", () => {
    expect(calculateTipFromPercent(10000, 15)).toBe(1500);
  });

  it("returns zero for 0%", () => {
    expect(calculateTipFromPercent(12990, 0)).toBe(0);
  });

  it("rounds to the nearest peso", () => {
    // 8999 * 15% = 1349.85 -> 1350
    expect(calculateTipFromPercent(8999, 15)).toBe(1350);
    // 3334 * 10% = 333.4 -> 333
    expect(calculateTipFromPercent(3334, 10)).toBe(333);
  });

  it("handles a zero base (free items, already-covered share)", () => {
    expect(calculateTipFromPercent(0, 10)).toBe(0);
  });

  it("rejects invalid bases and percents", () => {
    expect(() => calculateTipFromPercent(-1, 10)).toThrow(/base/i);
    expect(() => calculateTipFromPercent(100.5, 10)).toThrow(/base/i);
    expect(() => calculateTipFromPercent(1000, -5)).toThrow(/percent/i);
    expect(() => calculateTipFromPercent(1000, 101)).toThrow(/percent/i);
  });
});
