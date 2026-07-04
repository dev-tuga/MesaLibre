import { headers } from "next/headers";

import { env } from "@/lib/env";

function isLocalHost(host: string): boolean {
  const normalized = host.toLowerCase().split(":")[0] ?? host;
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized.endsWith(".local");
}

/**
 * Resolves the public base URL for links and QR codes.
 * Prefers the incoming request host (tunnel / LAN) over a stale localhost env var.
 */
export function resolvePublicBaseUrl(options: {
  host: string | null;
  proto: string | null;
  configuredBaseUrl: string;
}): string {
  const { host, proto, configuredBaseUrl } = options;

  if (host && !isLocalHost(host)) {
    const scheme = proto?.split(",")[0]?.trim() || "https";
    return `${scheme}://${host}`.replace(/\/+$/, "");
  }

  return configuredBaseUrl.replace(/\/+$/, "");
}

/** Server-only: base URL guests should use when scanning a table QR. */
export async function getPublicBaseUrl(): Promise<string> {
  const headerList = await headers();
  const forwardedHost = headerList.get("x-forwarded-host");
  const host = forwardedHost ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto");

  return resolvePublicBaseUrl({
    host,
    proto,
    configuredBaseUrl: env.NEXT_PUBLIC_APP_BASE_URL,
  });
}
