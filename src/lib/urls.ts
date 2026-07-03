/**
 * Absolute URL of a table's public page — the address encoded in its QR
 * code. Pure function so URL formatting stays testable and consistent
 * between the seed output, the admin panel and the printable QR sheet.
 */
export function buildTableUrl(baseUrl: string, slug: string, qrToken: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  if (!/^https?:\/\//.test(trimmedBase)) {
    throw new Error(`Invalid base URL: ${baseUrl}`);
  }
  return `${trimmedBase}/r/${encodeURIComponent(slug)}/${encodeURIComponent(qrToken)}`;
}
