import type { DistributeBody } from "./aid.types.js";
import { prisma } from "../../shared/prisma/client.js";
import { AppError } from "../../shared/errors/AppError.js";

export async function queueDistributions(callerDid: string, body: DistributeBody) {
  const issuer = await prisma.issuer.findUnique({ where: { did: callerDid } });
  if (!issuer) {
    throw new AppError("Caller must be a registered issuer DID", 403);
  }

  const holderDids = [...new Set(body.distributions.map((d) => d.holderDID))];
  const existing = await prisma.dIDRecord.findMany({
    where: { did: { in: holderDids } },
    select: { did: true },
  });
  const existingSet = new Set(existing.map((e) => e.did));
  const missing = holderDids.filter((d) => !existingSet.has(d));
  if (missing.length > 0) {
    throw new AppError(`Unknown holder DID(s): ${missing.join(", ")}`, 400);
  }

  const records = await prisma.$transaction(
    body.distributions.map((d) =>
      prisma.aidDistribution.create({
        data: {
          holderDID: d.holderDID,
          amountUSDC: d.amountUSDC,
          status: "QUEUED",
        },
      })
    )
  );

  return { queued: records.length, records };
}

export async function historyForHolder(holderDID: string) {
  return prisma.aidDistribution.findMany({
    where: { holderDID },
    orderBy: { distributedAt: "desc" },
  });
}
