"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { endShift, startShift } from "@/features/staff/actions/shift-actions";

type ShiftControlsProps = {
  hasActiveShift: boolean;
  showForRole: boolean;
};

export function ShiftControls({ hasActiveShift, showForRole }: ShiftControlsProps) {
  const [pending, startTransition] = useTransition();

  if (!showForRole) return null;

  function handleStart() {
    startTransition(async () => {
      const result = await startShift();
      if (result.ok) {
        toast.success("Turno iniciado");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleEnd() {
    startTransition(async () => {
      const result = await endShift();
      if (result.ok) {
        toast.success("Turno finalizado");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
      <div>
        <p className="font-medium">Tu turno</p>
        <p className="text-muted-foreground text-sm">
          {hasActiveShift
            ? "Turno activo — puedes tomar y atender mesas."
            : "Inicia turno para tomar mesas."}
        </p>
      </div>
      {hasActiveShift ? (
        <Button type="button" variant="outline" disabled={pending} onClick={handleEnd}>
          Finalizar turno
        </Button>
      ) : (
        <Button type="button" disabled={pending} onClick={handleStart}>
          Iniciar turno
        </Button>
      )}
    </div>
  );
}
