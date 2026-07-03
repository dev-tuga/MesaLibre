import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

/**
 * Prisma client singleton. In development, Next.js hot-reloads modules on
 * every change; caching the client on `globalThis` avoids exhausting the
 * database connection pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
