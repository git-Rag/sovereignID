import { prisma } from "../prisma/client.js";
import { getEnv } from "../../config/env.js";

export type ResolvedKey = {
  publicKeyHex: string;
  source: "did_record" | "issuer" | "ion";
};

/** DIDRecord first, then Issuer — used for DID auth middleware. */
export async function resolvePublicKeyForAuth(did: string): Promise<ResolvedKey | null> {
  const record = await prisma.dIDRecord.findUnique({ where: { did } });
  if (record) {
    return { publicKeyHex: record.publicKeyHex, source: "did_record" };
  }

  const issuer = await prisma.issuer.findUnique({ where: { did } });
  if (issuer) {
    return { publicKeyHex: issuer.publicKeyHex, source: "issuer" };
  }

  return null;
}

/**
 * Resolve DID → public key: local DIDRecord, then Issuer, then ION HTTP (best-effort).
 */
export async function resolveDidToPublicKey(did: string): Promise<ResolvedKey | null> {
  const local = await resolvePublicKeyForAuth(did);
  if (local) {
    return local;
  }

  const env = getEnv();
  const base = env.ION_NODE_URL.replace(/\/$/, "");
  try {
    const url = `${base}/v1.0/identifiers/${encodeURIComponent(did)}`;
    const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
    if (!res.ok) {
      return null;
    }
    const doc = (await res.json()) as {
      didDocument?: { verificationMethod?: Array<{ publicKeyJwk?: { x?: string } }> };
    };
    const vm = doc.didDocument?.verificationMethod?.[0];
    const x = vm?.publicKeyJwk?.x;
    if (typeof x === "string" && x.length > 0) {
      return { publicKeyHex: Buffer.from(x, "base64url").toString("hex"), source: "ion" };
    }
  } catch {
    return null;
  }

  return null;
}
