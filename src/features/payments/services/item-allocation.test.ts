import { describe, expect, it } from "vitest";

import {
  computeBillLineAvailability,
  sumItemSelection,
} from "@/features/payments/services/item-allocation";

describe("computeBillLineAvailability", () => {
  const items = [
    {
      id: "a",
      quantity: 2,
      unitPriceClp: 5000,
      product: { name: "Empanada" },
    },
    {
      id: "b",
      quantity: 1,
      unitPriceClp: 12000,
      product: { name: "Pisco" },
    },
  ];

  it("marks everything unpaid when there are no allocations", () => {
    expect(computeBillLineAvailability(items, [])).toEqual([
      expect.objectContaining({ orderItemId: "a", unpaidQuantity: 2 }),
      expect.objectContaining({ orderItemId: "b", unpaidQuantity: 1 }),
    ]);
  });

  it("subtracts quantities already covered by prior payments", () => {
    const result = computeBillLineAvailability(items, [{ orderItemId: "a", quantity: 1 }]);
    expect(result[0]?.unpaidQuantity).toBe(1);
    expect(result[1]?.unpaidQuantity).toBe(1);
  });
});

describe("sumItemSelection", () => {
  const lines = computeBillLineAvailability(
    [
      {
        id: "a",
        quantity: 2,
        unitPriceClp: 5000,
        product: { name: "Empanada" },
      },
    ],
    [],
  );

  it("totals selected unpaid units", () => {
    expect(sumItemSelection(lines, [{ orderItemId: "a", quantity: 1 }])).toBe(5000);
    expect(sumItemSelection(lines, [{ orderItemId: "a", quantity: 2 }])).toBe(10000);
  });

  it("rejects over-selection", () => {
    expect(() => sumItemSelection(lines, [{ orderItemId: "a", quantity: 3 }])).toThrow(
      /invalid_quantity/,
    );
  });
});
