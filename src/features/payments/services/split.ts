/**
 * Splitting money in CLP: amounts are integers, so dividing a bill in N
 * parts almost always leaves a remainder of a few pesos. The remainder is
 * assigned one peso at a time to the first parts, so no peso is ever lost
 * or invented and parts differ by at most $1.
 */

function assertPositiveInt(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
}

/**
 * Splits `totalClp` into `parts` integer amounts that sum exactly to the
 * total. Example: splitBill(10000, 3) -> [3334, 3333, 3333].
 */
export function splitBill(totalClp: number, parts: number): number[] {
  assertPositiveInt(totalClp, "total");
  assertPositiveInt(parts, "parts");

  const base = Math.floor(totalClp / parts);
  const remainder = totalClp % parts;

  return Array.from({ length: parts }, (_, i) => (i < remainder ? base + 1 : base));
}

/**
 * Amount owed by the next payer when the remaining balance is split in
 * `parts`. It is the largest part, so successive payers (each splitting
 * what is left into one part fewer) always close the bill exactly.
 */
export function nextShare(remainingClp: number, parts: number): number {
  return splitBill(remainingClp, parts)[0];
}
