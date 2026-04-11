import { z } from "zod";

export const verifyProofBodySchema = z.object({
  claim: z.string().min(1),
  value: z.boolean(),
  issuerDID: z.string().min(1),
  holderDID: z.string().min(1),
  signature: z.string().min(1),
});

export type VerifyProofBody = z.infer<typeof verifyProofBodySchema>;
