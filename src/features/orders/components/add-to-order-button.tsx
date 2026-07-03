"use client";

import { Loader2, Plus } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { addItemToOrder } from "@/features/orders/actions/order-actions";

type AddToOrderButtonProps = {
  slug: string;
  qrToken: string;
  productId: string;
  productName: string;
};

export function AddToOrderButton({ slug, qrToken, productId, productName }: AddToOrderButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await addItemToOrder({ slug, qrToken, productId, quantity: 1 });
      if (result.ok) {
        toast.success(`${productName} agregado a la cuenta`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={isPending}
      aria-label={`Agregar ${productName} a la cuenta`}
    >
      {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
      Agregar
    </Button>
  );
}
