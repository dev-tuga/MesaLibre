import { describe, expect, it } from "vitest";

import { nextShare, splitBill } from "./split";

describe("splitBill", () => {
  it("splits an exact division evenly", () => {
    expect(splitBill(9000, 3)).toEqual([3000, 3000, 3000]);
  });

  it("assigns the remainder one peso at a time to the first parts", () => {
    expect(splitBill(10000, 3)).toEqual([3334, 3333, 3333]);
    expect(splitBill(10001, 3)).toEqual([3334, 3334, 3333]);
    expect(splitBill(7, 4)).toEqual([2, 2, 2, 1]);
  });

  it("always sums exactly to the total", () => {
    for (const total of [1, 99, 12990, 45671, 100003]) {
      for (let parts = 1; parts <= 12; parts++) {
        const shares = splitBill(total, parts);
        expect(shares.reduce((a, b) => a + b, 0)).toBe(total);
      }
    }
  });

  it("never differs by more than one peso between parts", () => {
    const shares = splitBill(45671, 7);
    expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
  });

  it("handles a single part", () => {
    expect(splitBill(12990, 1)).toEqual([12990]);
  });

  it("handles more parts than pesos", () => {
    expect(splitBill(2, 3)).toEqual([1, 1, 0]);
  });

  it("rejects non-positive or fractional inputs", () => {
    expect(() => splitBill(0, 3)).toThrow(/total/i);
    expect(() => splitBill(-100, 3)).toThrow(/total/i);
    expect(() => splitBill(100.5, 3)).toThrow(/total/i);
    expect(() => splitBill(100, 0)).toThrow(/parts/i);
    expect(() => splitBill(100, 2.5)).toThrow(/parts/i);
  });
});

describe("nextShare", () => {
  it("returns the largest part of the split", () => {
    expect(nextShare(10000, 3)).toBe(3334);
    expect(nextShare(9000, 3)).toBe(3000);
  });

  it("closes the bill exactly when each payer splits what is left", () => {
    // Three friends split $10.000: 3334 + 3333 + 3333.
    const total = 10000;
    const first = nextShare(total, 3);
    const second = nextShare(total - first, 2);
    const third = total - first - second;

    expect([first, second, third]).toEqual([3334, 3333, 3333]);
    expect(first + second + third).toBe(total);
  });

  it("degenerates to paying everything for a single part", () => {
    expect(nextShare(12990, 1)).toBe(12990);
  });
});
