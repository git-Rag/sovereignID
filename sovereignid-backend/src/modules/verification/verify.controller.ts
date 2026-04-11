import type { NextFunction, Request, Response } from "express";
import { verifyProofBodySchema } from "./verify.types.js";
import * as verifyService from "./verify.service.js";

export async function postVerifyProof(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = verifyProofBodySchema.parse(req.body);
    const result = await verifyService.verifyProof(body);
    res.json(result);
  } catch (e) {
    next(e);
  }
}
