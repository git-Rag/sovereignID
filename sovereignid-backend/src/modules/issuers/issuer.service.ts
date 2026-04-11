import type { RegisterIssuerBody } from "./issuer.types.js";
import { prisma } from "../../shared/prisma/client.js";
import { AppError } from "../../shared/errors/AppError.js";

export async function upsertIssuer(body: RegisterIssuerBody) {
  return prisma.issuer.upsert({
    where: { did: body.did },
    create: {
      did: body.did,
      name: body.name,
      publicKeyHex: body.publicKeyHex,
      verified: false,
    },
    update: {
      name: body.name,
      publicKeyHex: body.publicKeyHex,
    },
  });
}

export async function getIssuerByDid(did: string) {
  const row = await prisma.issuer.findUnique({ where: { did } });
  if (!row) {
    throw new AppError("Issuer not found", 404);
  }
  return row;
}
