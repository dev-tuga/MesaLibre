/**
 * Absolute URL of a table's public bill page — the address encoded in its QR
 * code. Guests land directly on the live bill the waiter is building.
 */
export function buildTableUrl(baseUrl: string, slug: string, qrToken: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  if (!/^https?:\/\//.test(trimmedBase)) {
    throw new Error(`Invalid base URL: ${baseUrl}`);
  }
  return `${trimmedBase}/r/${encodeURIComponent(slug)}/${encodeURIComponent(qrToken)}/cuenta`;
}
