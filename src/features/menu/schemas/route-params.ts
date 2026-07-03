import { z } from "zod";

/** Params of the public table URL: /r/[slug]/[table]. */
export const tableRouteParamsSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  table: z.string().min(1).max(100),
});

export type TableRouteParams = z.infer<typeof tableRouteParamsSchema>;
