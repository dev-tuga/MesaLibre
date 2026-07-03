"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { toggleProductAvailability } from "@/features/menu/actions/admin-menu-actions";
import { cn } from "@/lib/utils";

type AvailabilityToggleProps = {
  productId: string;
  productName: string;
  available: boolean;
};

export function AvailabilityToggle({ productId, productName, available }: AvailabilityToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleProductAvailability({ id: productId, available: !available });
      if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={available}
      aria-label={`${productName}: ${available ? "disponible" : "no disponible"}`}
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50",
        available ? "border-primary bg-primary" : "border-input bg-muted",
      )}
    >
      <span
        className={cn(
          "bg-background block size-4 rounded-full shadow transition-transform",
          available ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
