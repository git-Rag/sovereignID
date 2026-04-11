import type { NextFunction, Request, Response } from "express";
import { verify as edVerify } from "../shared/crypto/ed25519.js";
import { resolvePublicKeyForAuth } from "../shared/crypto/didResolver.js";

declare global {
  namespace Express {
    interface Request {
      callerDID?: string;
    }
  }
}

export async function didAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const did = req.header("x-did");
  const signatureHex = req.header("x-signature");
  const challenge = req.header("x-challenge");

  if (!did || !signatureHex || !challenge) {
    res.status(401).json({ error: "Invalid DID signature" });
    return;
  }

  const now = Date.now();
  const ts = Number(challenge);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > 60_000) {
    res.status(401).json({ error: "Invalid DID signature" });
    return;
  }

  const resolved = await resolvePublicKeyForAuth(did);
  if (!resolved) {
    res.status(401).json({ error: "Invalid DID signature" });
    return;
  }

  const ok = await edVerify(challenge, signatureHex, resolved.publicKeyHex);
  if (!ok) {
    res.status(401).json({ error: "Invalid DID signature" });
    return;
  }

  req.callerDID = did;
  next();
}
