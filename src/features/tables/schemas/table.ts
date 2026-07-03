import { z } from "zod";

export const regenerateQrTokenSchema = z.object({
  tableId: z.string().min(1),
});

export type RegenerateQrTokenInput = z.infer<typeof regenerateQrTokenSchema>;
