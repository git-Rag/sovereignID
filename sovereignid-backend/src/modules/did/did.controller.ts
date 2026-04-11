import type { NextFunction, Request, Response } from "express";
import { anchorBodySchema } from "./did.types.js";
import * as didService from "./did.service.js";

export async function postAnchor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = anchorBodySchema.parse(req.body);
    const result = await didService.anchorDid(body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function getByDid(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const did = String(req.params.did);
    const result = await didService.getDidByDid(did);
    res.json(result);
  } catch (e) {
    next(e);
  }
}
