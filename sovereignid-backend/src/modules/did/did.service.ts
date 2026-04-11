import type { AnchorBody } from "./did.types.js";
import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma/client.js";
import { AppError } from "../../shared/errors/AppError.js";

export async function anchorDid(body: AnchorBody) {
  try {
    const created = await prisma.dIDRecord.create({
      data: {
        did: body.did,
        publicKeyHex: body.publicKeyHex,
        didDocument: body.didDocument as object,
        anchorStatus: "PENDING",
      },
      select: { id: true, did: true, anchorStatus: true },
    });
    return created;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new AppError("DID already anchored", 409);
    }
    throw e;
  }
}

export async function getDidByDid(did: string) {
  const row = await prisma.dIDRecord.findUnique({ where: { did } });
  if (!row) {
    throw new AppError("DID not found", 404);
  }
  return {
    did: row.did,
    publicKeyHex: row.publicKeyHex,
    didDocument: row.didDocument,
    anchorStatus: row.anchorStatus,
  };
}
