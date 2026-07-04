/**
 * Boundary between MesaLibre and any payment rail (Fintoc, Transbank, ...).
 * The application only ever talks to this interface; swapping the mock for
 * a real acquirer means adding an implementation and wiring it in the
 * factory — no changes anywhere else.
 */

export type ChargeRequest = {
  /** Bill share being paid, tip excluded. */
  amountClp: number;
  tipClp: number;
  /** Human-readable statement descriptor, e.g. "La Picada del Puerto — Mesa 3". */
  description: string;
  method?: "CARD" | "APPLE_PAY" | "GOOGLE_PAY";
  metadata: {
    orderId: string;
    restaurantSlug: string;
  };
};

export type ChargeResult =
  { status: "approved"; providerRef: string } | { status: "rejected"; reason: string };

export interface PaymentProvider {
  /** Unique provider identifier, stored alongside payments for audit. */
  readonly name: string;
  charge(request: ChargeRequest): Promise<ChargeResult>;
}
