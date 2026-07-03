const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

/** Formats an integer amount of Chilean pesos, e.g. 12990 -> "$12.990". */
export function formatClp(amountClp: number): string {
  return clpFormatter.format(amountClp);
}
