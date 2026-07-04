"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleReviewCta } from "@/features/feedback/components/google-review-cta";
import { payOrder } from "@/features/payments/actions/payment-actions";
import { MAX_CUSTOM_TIP_CLP, MAX_SPLIT_COUNT } from "@/features/payments/schemas/payment";
import {
  buildItemPaymentQuote,
  buildPaymentQuote,
  type TipChoice,
} from "@/features/payments/services/quote";
import type { BillLineAvailability } from "@/features/payments/services/item-allocation";
import { TIP_PERCENT_OPTIONS } from "@/features/payments/services/tip";
import { cn } from "@/lib/utils";
import { formatClp } from "@/lib/format";

type PaymentPanelProps = {
  slug: string;
  qrToken: string;
  remainingClp: number;
  headCount: number;
  restaurantName: string;
  googlePlaceId?: string | null;
  lines: BillLineAvailability[];
};

type SuccessState = {
  orderId: string;
  totalClp: number;
  orderClosed: boolean;
  method: "CARD" | "APPLE_PAY" | "GOOGLE_PAY";
};

type SplitMode = "EQUAL" | "BY_ITEMS";
type PayMethod = "CARD" | "APPLE_PAY" | "GOOGLE_PAY";

export function PaymentPanel({
  slug,
  qrToken,
  remainingClp,
  headCount,
  restaurantName,
  googlePlaceId,
  lines,
}: PaymentPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [splitMode, setSplitMode] = useState<SplitMode>("EQUAL");
  const [splitCount, setSplitCount] = useState(Math.min(Math.max(headCount, 1), MAX_SPLIT_COUNT));
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [tipPercent, setTipPercent] = useState(10);
  const [customTip, setCustomTip] = useState("");
  const [useCustomTip, setUseCustomTip] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const tipChoice = useMemo<TipChoice>(
    () =>
      useCustomTip
        ? { type: "custom", amountClp: Number.parseInt(customTip, 10) || 0 }
        : { type: "percent", percent: tipPercent as (typeof TIP_PERCENT_OPTIONS)[number] },
    [useCustomTip, customTip, tipPercent],
  );

  const itemSelections = useMemo(
    () =>
      Object.entries(selections)
        .filter(([, qty]) => qty > 0)
        .map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
    [selections],
  );

  const quote = useMemo(() => {
    try {
      if (splitMode === "EQUAL") {
        return buildPaymentQuote({ remainingClp, splitCount, tip: tipChoice });
      }
      if (itemSelections.length === 0) return null;
      return buildItemPaymentQuote({ lines, selections: itemSelections, tip: tipChoice });
    } catch {
      return null;
    }
  }, [splitMode, remainingClp, splitCount, tipChoice, itemSelections, lines]);

  function adjustSelection(orderItemId: string, delta: number, max: number) {
    setSelections((prev) => {
      const next = Math.min(max, Math.max(0, (prev[orderItemId] ?? 0) + delta));
      if (next === 0) {
        const copy = { ...prev };
        delete copy[orderItemId];
        return copy;
      }
      return { ...prev, [orderItemId]: next };
    });
  }

  function handlePay(method: PayMethod) {
    startTransition(async () => {
      const payload =
        splitMode === "EQUAL"
          ? {
              slug,
              qrToken,
              splitMode: "EQUAL" as const,
              splitCount,
              tip: tipChoice,
              method,
            }
          : {
              slug,
              qrToken,
              splitMode: "BY_ITEMS" as const,
              selections: itemSelections,
              tip: tipChoice,
              method,
            };

      const result = await payOrder(payload);
      if (result.ok) {
        setSuccess({
          orderId: result.orderId,
          totalClp: result.totalClp,
          orderClosed: result.orderClosed,
          method: result.method,
        });
        if (!result.orderClosed) router.refresh();
      } else {
        toast.error(result.error);
        router.refresh();
      }
    });
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="bg-card space-y-4 rounded-2xl border p-6 text-center shadow-sm">
          <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
          <div>
            <p className="text-xl font-semibold tracking-tight">Pago realizado</p>
            <p className="text-muted-foreground mt-1">
              {success.method === "APPLE_PAY"
                ? "Apple Pay"
                : success.method === "GOOGLE_PAY"
                  ? "Google Pay"
                  : "Tarjeta"}{" "}
              · {formatClp(success.totalClp)}
            </p>
          </div>
          {success.orderClosed ? (
            <>
              <p className="font-medium">La cuenta quedó pagada por completo. ¡Buen provecho!</p>
              <div className="flex flex-col gap-2">
                <Button asChild className="h-12 rounded-xl text-base">
                  <Link href={`/r/${slug}/${qrToken}/calificar/${success.orderId}`}>
                    Calificar en MesaLibre
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-xl">
                  <Link href={`/r/${slug}/${qrToken}/cuenta`}>Volver a la cuenta</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">
                Aún queda saldo por pagar entre el resto de la mesa.
              </p>
              <Button asChild variant="outline" className="h-12 w-full rounded-xl">
                <Link href={`/r/${slug}/${qrToken}/cuenta`}>Volver a la cuenta</Link>
              </Button>
            </>
          )}
        </div>
        {success.orderClosed ? (
          <GoogleReviewCta restaurantName={restaurantName} googlePlaceId={googlePlaceId} />
        ) : null}
      </div>
    );
  }

  const splitOptions = Array.from(
    { length: Math.min(MAX_SPLIT_COUNT, Math.max(headCount, 2)) - 1 },
    (_, i) => i + 2,
  );

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ModeCard
          active={splitMode === "EQUAL"}
          icon={<Users className="size-5" />}
          title="Partes iguales"
          description="Divide el saldo entre la mesa"
          onClick={() => setSplitMode("EQUAL")}
        />
        <ModeCard
          active={splitMode === "BY_ITEMS"}
          icon={<UtensilsCrossed className="size-5" />}
          title="Por consumo"
          description="Paga solo lo que pediste"
          onClick={() => setSplitMode("BY_ITEMS")}
        />
      </section>

      {splitMode === "EQUAL" ? (
        <section className="space-y-3">
          <Label className="text-base font-semibold">
            Personas en la división
            {headCount > 1 ? (
              <span className="text-muted-foreground ml-2 text-sm font-normal">
                (mesa de {headCount})
              </span>
            ) : null}
          </Label>
          <div className="flex flex-wrap gap-2">
            <Chip active={splitCount === 1} onClick={() => setSplitCount(1)}>
              Pagar todo
            </Chip>
            {splitOptions.map((n) => (
              <Chip key={n} active={splitCount === n} onClick={() => setSplitCount(n)}>
                ÷{n}
              </Chip>
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          <Label className="text-base font-semibold">Selecciona lo que pagas</Label>
          <ul className="bg-card divide-y rounded-2xl border shadow-sm">
            {lines
              .filter((line) => line.unpaidQuantity > 0)
              .map((line) => {
                const selected = selections[line.orderItemId] ?? 0;
                return (
                  <li key={line.orderItemId} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{line.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {formatClp(line.unitPriceClp)} · quedan {line.unpaidQuantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8 rounded-full"
                        disabled={selected === 0}
                        onClick={() => adjustSelection(line.orderItemId, -1, line.unpaidQuantity)}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <span className="w-6 text-center font-semibold tabular-nums">{selected}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8 rounded-full"
                        disabled={selected >= line.unpaidQuantity}
                        onClick={() => adjustSelection(line.orderItemId, 1, line.unpaidQuantity)}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <Label className="text-base font-semibold">Propina</Label>
        <div className="flex flex-wrap gap-2">
          {TIP_PERCENT_OPTIONS.map((percent) => (
            <Chip
              key={percent}
              active={!useCustomTip && tipPercent === percent}
              onClick={() => {
                setUseCustomTip(false);
                setTipPercent(percent);
              }}
            >
              {percent}%
            </Chip>
          ))}
          <Chip active={useCustomTip} onClick={() => setUseCustomTip(true)}>
            Otro
          </Chip>
        </div>
        {useCustomTip ? (
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_CUSTOM_TIP_CLP}
            placeholder="Monto en CLP"
            value={customTip}
            onChange={(e) => setCustomTip(e.target.value)}
            className="max-w-48 rounded-xl"
          />
        ) : null}
      </section>

      <Separator />

      <section className="bg-muted/30 space-y-2 rounded-2xl p-4 text-sm" aria-live="polite">
        <Row
          label={
            splitMode === "EQUAL" && splitCount > 1 ? `Tu parte (1 de ${splitCount})` : "Consumo"
          }
          value={quote ? formatClp(quote.amountClp) : "—"}
        />
        <Row label="Propina" value={quote ? formatClp(quote.tipClp) : "—"} />
        <Row label="Total" value={quote ? formatClp(quote.totalClp) : "—"} bold />
      </section>

      <div className="space-y-2">
        <WalletButton
          brand="apple"
          disabled={!quote || isPending}
          loading={isPending}
          onClick={() => handlePay("APPLE_PAY")}
        />
        <WalletButton
          brand="google"
          disabled={!quote || isPending}
          loading={isPending}
          onClick={() => handlePay("GOOGLE_PAY")}
        />
        <Button
          className="h-14 w-full rounded-2xl text-base shadow-md"
          disabled={!quote || isPending}
          onClick={() => handlePay("CARD")}
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Procesando…
            </>
          ) : (
            <>
              <CreditCard className="size-5" />
              Pagar con tarjeta {quote ? formatClp(quote.totalClp) : ""}
            </>
          )}
        </Button>
      </div>

      <p className="text-muted-foreground text-center text-xs leading-relaxed">
        Entorno de demostración: Apple Pay, Google Pay y tarjeta son simulados. No se realizan
        cargos reales.
      </p>
    </div>
  );
}

function ModeCard({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-left transition-all",
        active
          ? "border-primary bg-primary/5 ring-primary/20 shadow-sm ring-2"
          : "bg-card hover:bg-accent/40",
      )}
    >
      <div className={cn("mb-2", active ? "text-primary" : "text-muted-foreground")}>{icon}</div>
      <p className="font-semibold">{title}</p>
      <p className="text-muted-foreground text-xs">{description}</p>
    </button>
  );
}

function Chip({
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
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card",
      )}
    >
      {children}
    </button>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between", bold && "text-base font-semibold")}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function WalletButton({
  brand,
  disabled,
  loading,
  onClick,
}: {
  brand: "apple" | "google";
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  const isApple = brand === "apple";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold transition-opacity",
        isApple ? "bg-black text-white" : "border bg-white text-gray-800 shadow-sm",
        disabled && "opacity-50",
      )}
    >
      {loading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <span className="inline-flex items-center gap-2">
          {isApple ? (
            <>
              <span aria-hidden></span>
              Pay
            </>
          ) : (
            <>
              <span className="text-lg font-bold text-blue-600">G</span>
              Pay
            </>
          )}
        </span>
      )}
    </button>
  );
}
