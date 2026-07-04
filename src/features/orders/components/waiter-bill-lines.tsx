"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { waiterRemoveOrderItem } from "@/features/orders/actions/waiter-order-actions";
import { formatClp } from "@/lib/format";

type WaiterBillLinesProps = {
  tableId: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPriceClp: number;
    lineTotalClp: number;
  }[];
  editable: boolean;
};

export function WaiterBillLines({ tableId, items, editable }: WaiterBillLinesProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRemove(orderItemId: string) {
    startTransition(async () => {
      const result = await waiterRemoveOrderItem({ tableId, orderItemId });
      if (result.ok) {
        toast.success("Ítem eliminado.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground bg-card rounded-xl border p-6 text-center text-sm">
        La cuenta está vacía. Registra comensales y agrega productos.
      </p>
    );
  }

  return (
    <ul className="bg-card divide-y rounded-xl border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="font-medium">
              {item.quantity}× {item.name}
            </p>
            <p className="text-muted-foreground text-sm tabular-nums">
              {formatClp(item.unitPriceClp)} c/u
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tabular-nums">{formatClp(item.lineTotalClp)}</span>
            {editable ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isPending}
                aria-label={`Quitar ${item.name}`}
                onClick={() => handleRemove(item.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
