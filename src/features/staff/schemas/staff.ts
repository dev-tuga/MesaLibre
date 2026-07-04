import { z } from "zod";

export type StaffActionResult = { ok: true } | { ok: false; error: string };

export const claimTableSchema = z.object({
  tableId: z.string().min(1),
});

export const releaseTableSchema = z.object({
  tableId: z.string().min(1),
});

export const assignTableSchema = z.object({
  tableId: z.string().min(1),
  staffUserId: z.string().min(1),
});

export const reassignTableSchema = z.object({
  tableId: z.string().min(1),
  staffUserId: z.string().min(1),
});
