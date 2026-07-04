"use client";

import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setTableHeadCount } from "@/features/orders/actions/waiter-order-actions";
import { MAX_HEAD_COUNT } from "@/features/orders/schemas/waiter-order";
import { cn } from "@/lib/utils";

type HeadCountSelectorProps = {
  tableId: string;
  value: number;
  disabled?: boolean;
};

export function HeadCountSelector({ tableId, value, disabled }: HeadCountSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(count: number) {
    startTransition(async () => {
      const result = await setTableHeadCount({ tableId, headCount: count });
      if (result.ok) {
        toast.success(`Mesa registrada con ${count} comensal${count === 1 ? "" : "es"}.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="text-primary size-5" aria-hidden />
        <h2 className="font-semibold">Comensales en la mesa</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: MAX_HEAD_COUNT }, (_, i) => i + 1).map((count) => (
          <Button
            key={count}
            type="button"
            size="sm"
            variant={value === count ? "default" : "outline"}
            disabled={disabled || isPending}
            className={cn("min-w-10 rounded-full", value === count && "shadow-sm")}
            onClick={() => handleSelect(count)}
          >
            {count}
          </Button>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">
        Define cuántas personas están sentadas. Los comensales verán opciones de pago acordes a este
        número.
      </p>
    </section>
  );
}
