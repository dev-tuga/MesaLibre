"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignTable } from "@/features/staff/actions/table-service-actions";

type AssignTableSelectProps = {
  tableId: string;
  waiters: { id: string; name: string }[];
  currentWaiterId?: string | null;
};

export function AssignTableSelect({ tableId, waiters, currentWaiterId }: AssignTableSelectProps) {
  const [pending, startTransition] = useTransition();

  function handleAssign(staffUserId: string) {
    startTransition(async () => {
      const result = await assignTable({ tableId, staffUserId });
      if (result.ok) {
        toast.success("Mesa asignada al garzón");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Select disabled={pending} value={currentWaiterId ?? ""} onValueChange={handleAssign}>
      <SelectTrigger className="h-8 w-[160px]">
        <SelectValue placeholder="Asignar garzón" />
      </SelectTrigger>
      <SelectContent>
        {waiters.map((waiter) => (
          <SelectItem key={waiter.id} value={waiter.id}>
            {waiter.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
