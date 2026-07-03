import { MockPaymentProvider } from "@/features/payments/providers/mock-payment-provider";
import type { PaymentProvider } from "@/features/payments/providers/payment-provider";
import { env } from "@/lib/env";

const providers: Record<typeof env.PAYMENT_PROVIDER, () => PaymentProvider> = {
  mock: () => new MockPaymentProvider(),
};

export function getPaymentProvider(): PaymentProvider {
  return providers[env.PAYMENT_PROVIDER]();
}
