"use client";

import { useTransition } from "react";
import { HandPlatter } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { claimTable } from "@/features/staff/actions/table-service-actions";

type ClaimTableButtonProps = {
  tableId: number | string;
  label?: string;
  size?: "sm" | "default";
  className?: string;
};

export function ClaimTableButton({
  tableId,
  label = "Tomar mesa",
  size = "sm",
  className,
}: ClaimTableButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClaim() {
    startTransition(async () => {
      const result = await claimTable({ tableId: String(tableId) });
      if (result.ok) {
        toast.success("Mesa asignada");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      type="button"
      size={size}
      variant="outline"
      className={className}
      disabled={pending}
      onClick={handleClaim}
    >
      <HandPlatter className="size-4" />
      {label}
    </Button>
  );
}
