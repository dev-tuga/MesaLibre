import { describe, expect, it } from "vitest";

import { buildPaymentQuote, isFullyPaid, remainingBalance } from "./quote";

describe("remainingBalance / isFullyPaid", () => {
  it("tracks the outstanding balance", () => {
    expect(remainingBalance(10000, 0)).toBe(10000);
    expect(remainingBalance(10000, 3334)).toBe(6666);
    expect(remainingBalance(10000, 10000)).toBe(0);
  });

  it("never goes negative when someone overpays", () => {
    expect(remainingBalance(10000, 12000)).toBe(0);
  });

  it("reports full payment only when the total is covered", () => {
    expect(isFullyPaid(10000, 9999)).toBe(false);
    expect(isFullyPaid(10000, 10000)).toBe(true);
    expect(isFullyPaid(10000, 12000)).toBe(true);
  });

  it("treats an empty bill as not payable", () => {
    expect(isFullyPaid(0, 0)).toBe(false);
  });
});

describe("buildPaymentQuote", () => {
  it("quotes the full remaining balance for splitCount 1", () => {
    const quote = buildPaymentQuote({
      remainingClp: 42300,
      splitCount: 1,
      tip: { type: "percent", percent: 10 },
    });

    expect(quote).toEqual({ amountClp: 42300, tipClp: 4230, totalClp: 46530 });
  });

  it("quotes the largest part when splitting with remainder", () => {
    const quote = buildPaymentQuote({
      remainingClp: 10000,
      splitCount: 3,
      tip: { type: "percent", percent: 0 },
    });

    expect(quote).toEqual({ amountClp: 3334, tipClp: 0, totalClp: 3334 });
  });

  it("computes the tip over the payer's share, not the whole bill", () => {
    const quote = buildPaymentQuote({
      remainingClp: 10000,
      splitCount: 3,
      tip: { type: "percent", percent: 10 },
    });

    // 10% over 3334, not over 10000.
    expect(quote.tipClp).toBe(333);
    expect(quote.totalClp).toBe(3667);
  });

  it("accepts a custom tip amount", () => {
    const quote = buildPaymentQuote({
      remainingClp: 10000,
      splitCount: 2,
      tip: { type: "custom", amountClp: 800 },
    });

    expect(quote).toEqual({ amountClp: 5000, tipClp: 800, totalClp: 5800 });
  });

  it("lets three payers with sequential splits close the bill exactly", () => {
    const total = 10000;
    let paid = 0;
    const amounts: number[] = [];

    for (let people = 3; people >= 1; people--) {
      const quote = buildPaymentQuote({
        remainingClp: remainingBalance(total, paid),
        splitCount: people,
        tip: { type: "percent", percent: 10 },
      });
      amounts.push(quote.amountClp);
      paid += quote.amountClp;
    }

    expect(amounts).toEqual([3334, 3333, 3333]);
    expect(isFullyPaid(total, paid)).toBe(true);
    expect(remainingBalance(total, paid)).toBe(0);
  });

  it("rejects a settled or invalid balance", () => {
    expect(() =>
      buildPaymentQuote({ remainingClp: 0, splitCount: 1, tip: { type: "percent", percent: 0 } }),
    ).toThrow(/nothing left/i);
  });

  it("rejects invalid split counts and custom tips", () => {
    expect(() =>
      buildPaymentQuote({ remainingClp: 100, splitCount: 0, tip: { type: "percent", percent: 0 } }),
    ).toThrow(/split/i);
    expect(() =>
      buildPaymentQuote({
        remainingClp: 100,
        splitCount: 1,
        tip: { type: "custom", amountClp: -50 },
      }),
    ).toThrow(/tip/i);
  });
});
