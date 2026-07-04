import { randomUUID } from "node:crypto";

import type {
  ChargeRequest,
  ChargeResult,
  PaymentProvider,
} from "@/features/payments/providers/payment-provider";

/**
 * Simulated acquirer for development and demos: approves every well-formed
 * charge after a short delay, mimicking a card network round-trip.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  constructor(private readonly latencyMs = 600) {}

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    if (request.amountClp < 1 || request.tipClp < 0) {
      return { status: "rejected", reason: "invalid_amount" };
    }

    await new Promise((resolve) => setTimeout(resolve, this.latencyMs));

    const prefix =
      request.method === "APPLE_PAY"
        ? "mock_apple"
        : request.method === "GOOGLE_PAY"
          ? "mock_google"
          : "mock_card";

    return { status: "approved", providerRef: `${prefix}_${randomUUID()}` };
  }
}
