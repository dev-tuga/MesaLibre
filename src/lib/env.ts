import { z } from "zod";

/**
 * Server-side environment variables, validated once at startup.
 * Import `env` instead of reading `process.env` directly so that a
 * misconfigured deployment fails fast with a readable error.
 */
const envSchema = z.object({
  DATABASE_URL: z.url({ message: "DATABASE_URL must be a valid connection string" }),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Payment rail to use. Only the simulated provider exists for now. */
  PAYMENT_PROVIDER: z.enum(["mock"]).default("mock"),
  /** Session signing secret for NextAuth. Generate with `openssl rand -base64 32`. */
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
});

function loadEnv(): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Invalid environment variables:", z.treeifyError(result.error));
    throw new Error("Invalid environment variables. Check your .env file against .env.example.");
  }

  return result.data;
}

export const env = loadEnv();
