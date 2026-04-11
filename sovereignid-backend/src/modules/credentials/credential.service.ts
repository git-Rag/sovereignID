import type { IssueCredentialBody, RevokeCredentialBody } from "./credential.types.js";
import { prisma } from "../../shared/prisma/client.js";
import { AppError } from "../../shared/errors/AppError.js";
import { verify as edVerify } from "../../shared/crypto/ed25519.js";
import { Prisma } from "@prisma/client";

export async function issueCredential(callerDid: string, body: IssueCredentialBody) {
  if (callerDid !== body.issuerDID) {
    throw new AppError("Authenticated DID must match issuerDID", 403);
  }

  const issuer = await prisma.issuer.findUnique({ where: { did: body.issuerDID } });
  if (!issuer) {
    throw new AppError("Issuer not registered", 404);
  }

  const sigOk = await edVerify(body.credentialHash, body.signature, issuer.publicKeyHex);
  if (!sigOk) {
    throw new AppError("Invalid credential signature", 400);
  }

  try {
    const credential = await prisma.credential.create({
      data: {
        holderDID: body.holderDID,
        issuerDID: body.issuerDID,
        credentialType: body.credentialType,
        credentialHash: body.credentialHash,
      },
    });

    const warning = issuer.verified ? undefined : "Issuer is not verified";
    if (warning) {
      return { ...credential, warning };
    }
    return credential;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new AppError("Credential hash already exists", 409);
    }
    throw e;
  }
}

export async function listCredentialsForHolder(holderDID: string) {
  return prisma.credential.findMany({
    where: { holderDID, revoked: false },
    orderBy: { issuedAt: "desc" },
  });
}

export async function revokeCredential(callerDid: string, body: RevokeCredentialBody) {
  const cred = await prisma.credential.findUnique({
    where: { credentialHash: body.credentialHash },
  });
  if (!cred) {
    throw new AppError("Credential not found", 404);
  }
  if (cred.issuerDID !== callerDid) {
    throw new AppError("Only the issuing DID can revoke this credential", 403);
  }

  const issuer = await prisma.issuer.findUnique({ where: { did: cred.issuerDID } });
  if (!issuer) {
    throw new AppError("Issuer not found", 404);
  }

  const sigOk = await edVerify(body.credentialHash, body.signature, issuer.publicKeyHex);
  if (!sigOk) {
    throw new AppError("Invalid revoke signature", 400);
  }

  return prisma.credential.update({
    where: { credentialHash: body.credentialHash },
    data: { revoked: true, revokedAt: new Date() },
  });
}
