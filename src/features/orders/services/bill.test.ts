import { describe, expect, it } from "vitest";

import { calculateBill, calculateLineTotal } from "./bill";

describe("calculateLineTotal", () => {
  it("multiplies quantity by unit price", () => {
    expect(calculateLineTotal(3, 4500)).toBe(13500);
  });

  it("accepts free items (price 0)", () => {
    expect(calculateLineTotal(2, 0)).toBe(0);
  });

  it("rejects zero or negative quantities", () => {
    expect(() => calculateLineTotal(0, 1000)).toThrow(/quantity/i);
    expect(() => calculateLineTotal(-1, 1000)).toThrow(/quantity/i);
  });

  it("rejects non-integer quantities and prices", () => {
    expect(() => calculateLineTotal(1.5, 1000)).toThrow(/quantity/i);
    expect(() => calculateLineTotal(1, 999.5)).toThrow(/price/i);
  });

  it("rejects negative prices", () => {
    expect(() => calculateLineTotal(1, -100)).toThrow(/price/i);
  });
});

describe("calculateBill", () => {
  const items = [
    { id: "a", name: "Lomo a lo pobre", quantity: 2, unitPriceClp: 14500 },
    { id: "b", name: "Terremoto", quantity: 3, unitPriceClp: 5900 },
    { id: "c", name: "Sopaipillas con pebre", quantity: 1, unitPriceClp: 3900 },
  ];

  it("computes line totals, item count and grand total", () => {
    const bill = calculateBill(items);

    expect(bill.lines.map((l) => l.lineTotalClp)).toEqual([29000, 17700, 3900]);
    expect(bill.itemCount).toBe(6);
    expect(bill.totalClp).toBe(50600);
  });

  it("returns an empty bill for no items", () => {
    const bill = calculateBill([]);

    expect(bill.lines).toEqual([]);
    expect(bill.itemCount).toBe(0);
    expect(bill.totalClp).toBe(0);
  });

  it("keeps line order stable", () => {
    const bill = calculateBill(items);
    expect(bill.lines.map((l) => l.id)).toEqual(["a", "b", "c"]);
  });
});
