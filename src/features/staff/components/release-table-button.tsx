"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { releaseTable } from "@/features/staff/actions/table-service-actions";

type ReleaseTableButtonProps = {
  tableId: string;
};

export function ReleaseTableButton({ tableId }: ReleaseTableButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleRelease() {
    startTransition(async () => {
      const result = await releaseTable({ tableId });
      if (result.ok) {
        toast.success("Mesa liberada");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={handleRelease}>
      Liberar mesa
    </Button>
  );
}
