import type { NextFunction, Request, Response } from "express";
import { registerIssuerBodySchema } from "./issuer.types.js";
import * as issuerService from "./issuer.service.js";

export async function postRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = registerIssuerBodySchema.parse(req.body);
    const issuer = await issuerService.upsertIssuer(body);
    res.status(200).json(issuer);
  } catch (e) {
    next(e);
  }
}

export async function getByDid(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const did = String(req.params.did);
    const issuer = await issuerService.getIssuerByDid(did);
    res.json(issuer);
  } catch (e) {
    next(e);
  }
}
