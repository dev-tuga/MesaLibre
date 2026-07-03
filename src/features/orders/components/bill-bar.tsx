import Link from "next/link";
import { ReceiptText } from "lucide-react";

import type { Bill } from "@/features/orders/services/bill";
import { formatClp } from "@/lib/format";

type BillBarProps = {
  slug: string;
  qrToken: string;
  bill: Bill;
};

/** Sticky bottom bar on the menu linking to the table's bill. */
export function BillBar({ slug, qrToken, bill }: BillBarProps) {
  if (bill.itemCount === 0) {
    return null;
  }

  return (
    <div className="bg-background/95 fixed inset-x-0 bottom-0 z-20 border-t p-3 backdrop-blur">
      <div className="mx-auto max-w-xl">
        <Link
          href={`/r/${slug}/${qrToken}/cuenta`}
          className="bg-primary text-primary-foreground flex items-center justify-between rounded-xl px-4 py-3 font-medium transition-opacity hover:opacity-90"
        >
          <span className="flex items-center gap-2">
            <ReceiptText className="size-4" aria-hidden />
            Ver cuenta ({bill.itemCount} {bill.itemCount === 1 ? "ítem" : "ítems"})
          </span>
          <span className="tabular-nums">{formatClp(bill.totalClp)}</span>
        </Link>
      </div>
    </div>
  );
}
