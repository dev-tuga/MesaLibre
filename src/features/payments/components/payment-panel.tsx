"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { payOrder } from "@/features/payments/actions/payment-actions";
import { MAX_CUSTOM_TIP_CLP, MAX_SPLIT_COUNT } from "@/features/payments/schemas/payment";
import { buildPaymentQuote, type TipChoice } from "@/features/payments/services/quote";
import { TIP_PERCENT_OPTIONS } from "@/features/payments/services/tip";
import { cn } from "@/lib/utils";
import { formatClp } from "@/lib/format";

type PaymentPanelProps = {
  slug: string;
  qrToken: string;
  remainingClp: number;
};

type SuccessState = {
  orderId: string;
  totalClp: number;
  orderClosed: boolean;
};

const SPLIT_OPTIONS = Array.from({ length: MAX_SPLIT_COUNT - 1 }, (_, i) => i + 2);

export function PaymentPanel({ slug, qrToken, remainingClp }: PaymentPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [splitCount, setSplitCount] = useState(1);
  const [tipPercent, setTipPercent] = useState<number>(10);
  const [customTip, setCustomTip] = useState("");
  const [useCustomTip, setUseCustomTip] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const quote = useMemo(() => {
    const tip: TipChoice = useCustomTip
      ? { type: "custom", amountClp: Number.parseInt(customTip, 10) || 0 }
      : { type: "percent", percent: tipPercent };
    try {
      return buildPaymentQuote({ remainingClp, splitCount, tip });
    } catch {
      return null;
    }
  }, [remainingClp, splitCount, useCustomTip, customTip, tipPercent]);

  function handlePay() {
    const tip: TipChoice = useCustomTip
      ? { type: "custom", amountClp: Number.parseInt(customTip, 10) || 0 }
      : { type: "percent", percent: tipPercent };
    startTransition(async () => {
      const result = await payOrder({ slug, qrToken, splitCount, tip });
      if (result.ok) {
        setSuccess({
          orderId: result.orderId,
          totalClp: result.totalClp,
          orderClosed: result.orderClosed,
        });
        router.refresh();
      } else {
        toast.error(result.error);
        router.refresh();
      }
    });
  }

  if (success) {
    return (
      <div className="bg-card space-y-4 rounded-xl border p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-green-600" aria-hidden />
        <div>
          <p className="text-lg font-semibold">Pago realizado</p>
          <p className="text-muted-foreground">
            Se cargaron {formatClp(success.totalClp)} a tu tarjeta.
          </p>
        </div>
        {success.orderClosed ? (
          <>
            <p className="font-medium">La cuenta quedó pagada por completo. ¡Buen provecho!</p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href={`/r/${slug}/${qrToken}/calificar/${success.orderId}`}>
                  Calificar el servicio
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/r/${slug}/${qrToken}`}>Volver a la carta</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              Aún queda saldo por pagar entre el resto de la mesa.
            </p>
            <Button asChild variant="outline">
              <Link href={`/r/${slug}/${qrToken}/cuenta`}>Volver a la cuenta</Link>
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Label className="text-base">¿Cómo quieres pagar?</Label>
        <div className="flex flex-wrap gap-2">
          <SplitChip active={splitCount === 1} onClick={() => setSplitCount(1)}>
            Pagar todo
          </SplitChip>
          {SPLIT_OPTIONS.map((n) => (
            <SplitChip key={n} active={splitCount === n} onClick={() => setSplitCount(n)}>
              ÷{n}
            </SplitChip>
          ))}
        </div>
        {splitCount > 1 ? (
          <p className="text-muted-foreground text-sm">
            Lo que falta se divide en {splitCount} partes iguales y tú pagas la primera. Si la
            división no es exacta, las primeras partes absorben la diferencia de $1.
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <Label className="text-base">Propina</Label>
        <div className="flex flex-wrap gap-2">
          {TIP_PERCENT_OPTIONS.map((percent) => (
            <SplitChip
              key={percent}
              active={!useCustomTip && tipPercent === percent}
              onClick={() => {
                setUseCustomTip(false);
                setTipPercent(percent);
              }}
            >
              {percent}%
            </SplitChip>
          ))}
          <SplitChip active={useCustomTip} onClick={() => setUseCustomTip(true)}>
            Otro monto
          </SplitChip>
        </div>
        {useCustomTip ? (
          <div className="max-w-48">
            <Label htmlFor="custom-tip" className="sr-only">
              Propina en pesos
            </Label>
            <Input
              id="custom-tip"
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_CUSTOM_TIP_CLP}
              step={100}
              placeholder="Ej: 2000"
              value={customTip}
              onChange={(event) => setCustomTip(event.target.value)}
            />
          </div>
        ) : null}
      </section>

      <Separator />

      <section className="space-y-2 text-sm" aria-live="polite">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {splitCount === 1 ? "Saldo de la cuenta" : `Tu parte (1 de ${splitCount})`}
          </span>
          <span className="font-medium tabular-nums">
            {quote ? formatClp(quote.amountClp) : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Propina</span>
          <span className="font-medium tabular-nums">{quote ? formatClp(quote.tipClp) : "—"}</span>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <span>Total a pagar</span>
          <span className="tabular-nums">{quote ? formatClp(quote.totalClp) : "—"}</span>
        </div>
      </section>

      <Button className="w-full" size="lg" disabled={!quote || isPending} onClick={handlePay}>
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Procesando pago…
          </>
        ) : (
          `Pagar ${quote ? formatClp(quote.totalClp) : ""}`
        )}
      </Button>
      <p className="text-muted-foreground text-center text-xs">
        Pago simulado con fines de demostración: no se cobra a ninguna tarjeta real.
      </p>
    </div>
  );
}

function SplitChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
