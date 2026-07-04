import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { cache } from "react";

import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createAdapterClient(connectionString: string): PrismaClient {
  const pool = new Pool({ connectionString, maxUses: 1 });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function getLocalPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const pool = new Pool({ connectionString: env.DATABASE_URL, maxUses: 1 });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}

function getHyperdriveUrl(cfEnv: unknown): string | null {
  const env = cfEnv as { HYPERDRIVE?: { connectionString: string } };
  return env.HYPERDRIVE?.connectionString ?? null;
}

function getConnectionStringFromCloudflare(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare") as {
      getCloudflareContext: () => { env: unknown };
    };
    const { env: cfEnv } = getCloudflareContext();
    return getHyperdriveUrl(cfEnv);
  } catch {
    return null;
  }
}

/**
 * Returns a Prisma client scoped to the current request.
 * On Cloudflare Workers, uses Hyperdrive with the pg driver adapter.
 * In local Node development, reuses a singleton to avoid exhausting the pool.
 */
export const getPrisma = cache((): PrismaClient => {
  const hyperdriveUrl = getConnectionStringFromCloudflare();
  if (hyperdriveUrl) {
    return createAdapterClient(hyperdriveUrl);
  }

  if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
    return getLocalPrisma();
  }

  return createAdapterClient(env.DATABASE_URL);
});

/**
 * Async variant for static/ISR routes where Cloudflare context
 * must be resolved with `async: true`.
 */
export const getPrismaAsync = cache(async (): Promise<PrismaClient> => {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env: cfEnv } = await getCloudflareContext({ async: true });
    const hyperdriveUrl = getHyperdriveUrl(cfEnv);
    if (hyperdriveUrl) {
      return createAdapterClient(hyperdriveUrl);
    }
  } catch {
    // Not running on Cloudflare.
  }

  if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
    return getLocalPrisma();
  }

  return createAdapterClient(env.DATABASE_URL);
});
