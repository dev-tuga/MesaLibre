import { RemoveItemButton } from "@/features/orders/components/remove-item-button";
import type { Bill } from "@/features/orders/services/bill";
import { formatClp } from "@/lib/format";

type BillLinesProps = {
  slug: string;
  qrToken: string;
  bill: Bill;
  /** When false (e.g. while paying), the remove buttons are hidden. */
  editable?: boolean;
};

export function BillLines({ slug, qrToken, bill, editable = true }: BillLinesProps) {
  return (
    <div className="bg-card rounded-xl border">
      <ul className="divide-y">
        {bill.lines.map((line) => (
          <li key={line.id} className="flex items-center gap-3 p-4">
            <span className="text-muted-foreground w-8 shrink-0 text-sm font-medium tabular-nums">
              {line.quantity}×
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{line.name}</p>
              <p className="text-muted-foreground text-sm tabular-nums">
                {formatClp(line.unitPriceClp)} c/u
              </p>
            </div>
            <span className="font-semibold tabular-nums">{formatClp(line.lineTotalClp)}</span>
            {editable ? (
              <RemoveItemButton
                slug={slug}
                qrToken={qrToken}
                orderItemId={line.id}
                itemName={line.name}
              />
            ) : null}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t p-4">
        <span className="font-semibold">Total</span>
        <span className="text-lg font-bold tabular-nums">{formatClp(bill.totalClp)}</span>
      </div>
    </div>
  );
}
