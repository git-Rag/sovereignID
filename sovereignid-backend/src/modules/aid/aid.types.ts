import { z } from "zod";

export const distributeBodySchema = z.object({
  distributions: z
    .array(
      z.object({
        holderDID: z.string().min(1),
        amountUSDC: z.number().finite().nonnegative(),
      })
    )
    .min(1),
});

export type DistributeBody = z.infer<typeof distributeBodySchema>;
