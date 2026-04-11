import { z } from "zod";

export const registerIssuerBodySchema = z.object({
  did: z.string().min(1),
  name: z.string().min(1),
  publicKeyHex: z.string().min(1),
});

export type RegisterIssuerBody = z.infer<typeof registerIssuerBodySchema>;
