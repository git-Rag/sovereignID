import type { VerifyProofBody } from "./verify.types.js";
import { prisma } from "../../shared/prisma/client.js";
import { verify as edVerify } from "../../shared/crypto/ed25519.js";

export async function verifyProof(body: VerifyProofBody) {
  const issuer = await prisma.issuer.findUnique({ where: { did: body.issuerDID } });
  if (!issuer) {
    return {
      valid: false,
      issuerName: "",
      claim: body.claim,
      value: body.value,
    };
  }

  const payload = JSON.stringify({
    claim: body.claim,
    value: body.value,
    holderDID: body.holderDID,
  });

  const sigOk = await edVerify(payload, body.signature, issuer.publicKeyHex);
  if (!sigOk) {
    return {
      valid: false,
      issuerName: issuer.name,
      claim: body.claim,
      value: body.value,
    };
  }

  const revoked = await prisma.credential.findFirst({
    where: { holderDID: body.holderDID, revoked: true },
  });

  if (revoked) {
    return {
      valid: false,
      issuerName: issuer.name,
      claim: body.claim,
      value: body.value,
    };
  }

  return {
    valid: true,
    issuerName: issuer.name,
    claim: body.claim,
    value: body.value,
  };
}
