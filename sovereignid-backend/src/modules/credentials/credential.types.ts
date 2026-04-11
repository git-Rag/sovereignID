import { z } from "zod";

export const issueCredentialBodySchema = z.object({
  holderDID: z.string().min(1),
  issuerDID: z.string().min(1),
  credentialType: z.string().min(1),
  credentialHash: z.string().min(1),
  signature: z.string().min(1),
});

export type IssueCredentialBody = z.infer<typeof issueCredentialBodySchema>;

export const revokeCredentialBodySchema = z.object({
  credentialHash: z.string().min(1),
  signature: z.string().min(1),
});

export type RevokeCredentialBody = z.infer<typeof revokeCredentialBodySchema>;
