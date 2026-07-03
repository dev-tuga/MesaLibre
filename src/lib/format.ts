const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

/** Formats an integer amount of Chilean pesos, e.g. 12990 -> "$12.990". */
export function formatClp(amountClp: number): string {
  return clpFormatter.format(amountClp);
}

const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Santiago",
});

/** Formats a timestamp for admin views, e.g. "02-07-26, 21:15". */
export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}
