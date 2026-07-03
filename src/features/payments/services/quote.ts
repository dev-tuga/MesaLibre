import { nextShare } from "@/features/payments/services/split";
import { calculateTipFromPercent } from "@/features/payments/services/tip";

export type TipChoice =
  { type: "percent"; percent: number } | { type: "custom"; amountClp: number };

export type PaymentQuote = {
  /** Share of the bill this payment covers (tip excluded). */
  amountClp: number;
  tipClp: number;
  /** What the payer's card is charged: amount + tip. */
  totalClp: number;
};

export function remainingBalance(totalClp: number, paidClp: number): number {
  return Math.max(0, totalClp - paidClp);
}

export function isFullyPaid(totalClp: number, paidClp: number): boolean {
  return totalClp > 0 && paidClp >= totalClp;
}

/**
 * Computes what a payer owes given the outstanding balance, how many parts
 * the balance is split into (1 = pay everything) and the chosen tip.
 * Pure function shared by the payment UI (preview) and the server action
 * (authoritative amounts).
 */
export function buildPaymentQuote(input: {
  remainingClp: number;
  splitCount: number;
  tip: TipChoice;
}): PaymentQuote {
  const { remainingClp, splitCount, tip } = input;

  if (!Number.isInteger(remainingClp) || remainingClp < 1) {
    throw new Error(`Nothing left to pay: ${remainingClp}`);
  }
  if (!Number.isInteger(splitCount) || splitCount < 1) {
    throw new Error(`Invalid split count: ${splitCount}`);
  }

  const amountClp = splitCount === 1 ? remainingClp : nextShare(remainingClp, splitCount);

  let tipClp: number;
  if (tip.type === "percent") {
    tipClp = calculateTipFromPercent(amountClp, tip.percent);
  } else {
    if (!Number.isInteger(tip.amountClp) || tip.amountClp < 0) {
      throw new Error(`Invalid custom tip: ${tip.amountClp}`);
    }
    tipClp = tip.amountClp;
  }

  return { amountClp, tipClp, totalClp: amountClp + tipClp };
}
