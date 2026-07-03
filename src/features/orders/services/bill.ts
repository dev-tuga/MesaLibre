/**
 * Pure bill math for an open order. No I/O here: these functions receive
 * plain data and return plain data, so they are trivially unit-testable.
 */

export type BillItemInput = {
  id: string;
  name: string;
  quantity: number;
  unitPriceClp: number;
};

export type BillLine = BillItemInput & {
  lineTotalClp: number;
};

export type Bill = {
  lines: BillLine[];
  /** Total number of units across all lines. */
  itemCount: number;
  totalClp: number;
};

export function calculateLineTotal(quantity: number, unitPriceClp: number): number {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error(`Invalid quantity: ${quantity}`);
  }
  if (!Number.isInteger(unitPriceClp) || unitPriceClp < 0) {
    throw new Error(`Invalid unit price: ${unitPriceClp}`);
  }
  return quantity * unitPriceClp;
}

export function calculateBill(items: BillItemInput[]): Bill {
  const lines = items.map((item) => ({
    ...item,
    lineTotalClp: calculateLineTotal(item.quantity, item.unitPriceClp),
  }));

  return {
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    totalClp: lines.reduce((sum, line) => sum + line.lineTotalClp, 0),
  };
}
