import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  /** Hide the floating Next.js dev indicator in development (cleaner mobile demos). */
  devIndicators: false,
  poweredByHeader: false,
};

export default nextConfig;

import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
