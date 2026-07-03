"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { removeOrderItem } from "@/features/orders/actions/order-actions";

type RemoveItemButtonProps = {
  slug: string;
  qrToken: string;
  orderItemId: string;
  itemName: string;
};

export function RemoveItemButton({ slug, qrToken, orderItemId, itemName }: RemoveItemButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await removeOrderItem({ slug, qrToken, orderItemId });
      if (result.ok) {
        toast.success(`${itemName} quitado de la cuenta`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      size="icon-sm"
      variant="ghost"
      onClick={handleClick}
      disabled={isPending}
      aria-label={`Quitar ${itemName} de la cuenta`}
    >
      {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
    </Button>
  );
}
