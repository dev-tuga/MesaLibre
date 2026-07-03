export const TIP_PERCENT_OPTIONS = [0, 10, 15] as const;

export type TipPercent = (typeof TIP_PERCENT_OPTIONS)[number];

/**
 * Tip for a payment, rounded to the nearest peso. In Chile the customary
 * tip is 10% over what each person pays, so the base is the payer's share,
 * not the whole bill.
 */
export function calculateTipFromPercent(baseClp: number, percent: number): number {
  if (!Number.isInteger(baseClp) || baseClp < 0) {
    throw new Error(`Invalid tip base: ${baseClp}`);
  }
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error(`Invalid tip percent: ${percent}`);
  }
  return Math.round((baseClp * percent) / 100);
}
