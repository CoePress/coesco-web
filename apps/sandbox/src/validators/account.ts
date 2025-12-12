import { z } from "zod";

export const AccountStatusSchema = z.enum(["ACTIVE", "PROSPECT", "INACTIVE"]);

const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(32)
  .regex(/^[0-9+().\-\s]+$/, "Invalid phone format");

export const CreateAccountSchema = z.object({
  name: z.string().trim().min(1).max(200),
  website: z.string().trim().url().max(500).optional().or(z.literal("").transform(() => undefined)),
  phone: phoneSchema.optional().or(z.literal("").transform(() => undefined)),
  industry: z.string().trim().max(120).optional().or(z.literal("").transform(() => undefined)),
  status: AccountStatusSchema.optional(),
  notes: z.string().trim().max(5000).optional().or(z.literal("").transform(() => undefined)),
  ownerEmployeeId: z.string().uuid().optional().nullable(),
});

export const UpdateAccountSchema = CreateAccountSchema.partial();
