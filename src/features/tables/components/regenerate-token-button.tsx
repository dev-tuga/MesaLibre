"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { regenerateQrToken } from "@/features/tables/actions/table-actions";

type RegenerateTokenButtonProps = {
  tableId: string;
  tableNumber: number;
};

export function RegenerateTokenButton({ tableId, tableNumber }: RegenerateTokenButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateQrToken({ tableId });
      if (result.ok) {
        toast.success(`Nuevo QR generado para la mesa ${tableNumber}`);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw />
          Regenerar QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>¿Regenerar el QR de la mesa {tableNumber}?</DialogTitle>
          <DialogDescription>
            El QR impreso actual dejará de funcionar de inmediato y tendrás que imprimir el nuevo.
            Los clientes sentados ahora perderán el acceso a la cuenta desde su teléfono.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleRegenerate} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : null}
            Regenerar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
