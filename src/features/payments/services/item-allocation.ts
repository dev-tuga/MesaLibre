export type BillLineAvailability = {
  orderItemId: string;
  name: string;
  unitPriceClp: number;
  totalQuantity: number;
  unpaidQuantity: number;
};

export type ItemSelection = {
  orderItemId: string;
  quantity: number;
};

type OrderItemRow = {
  id: string;
  quantity: number;
  unitPriceClp: number;
  product: { name: string };
};

type AllocationRow = {
  orderItemId: string;
  quantity: number;
};

/** How many units of each line are still unpaid after prior payments. */
export function computeBillLineAvailability(
  items: OrderItemRow[],
  allocations: AllocationRow[],
): BillLineAvailability[] {
  const paidByItem = new Map<string, number>();
  for (const row of allocations) {
    paidByItem.set(row.orderItemId, (paidByItem.get(row.orderItemId) ?? 0) + row.quantity);
  }

  return items.map((item) => {
    const paidQty = paidByItem.get(item.id) ?? 0;
    return {
      orderItemId: item.id,
      name: item.product.name,
      unitPriceClp: item.unitPriceClp,
      totalQuantity: item.quantity,
      unpaidQuantity: Math.max(0, item.quantity - paidQty),
    };
  });
}

/** Sums the CLP value of a guest's item selection. */
export function sumItemSelection(
  lines: BillLineAvailability[],
  selections: ItemSelection[],
): number {
  const byId = new Map(lines.map((line) => [line.orderItemId, line]));
  let total = 0;

  for (const selection of selections) {
    const line = byId.get(selection.orderItemId);
    if (!line) {
      throw new Error(`unknown_item:${selection.orderItemId}`);
    }
    if (selection.quantity < 1 || selection.quantity > line.unpaidQuantity) {
      throw new Error(`invalid_quantity:${selection.orderItemId}`);
    }
    total += line.unitPriceClp * selection.quantity;
  }

  if (total < 1) {
    throw new Error("empty_selection");
  }

  return total;
}
