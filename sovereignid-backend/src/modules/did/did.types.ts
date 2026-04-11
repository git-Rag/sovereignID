import { z } from "zod";

export const anchorBodySchema = z.object({
  did: z.string().min(1),
  publicKeyHex: z.string().min(1),
  didDocument: z.record(z.string(), z.unknown()),
});

export type AnchorBody = z.infer<typeof anchorBodySchema>;
