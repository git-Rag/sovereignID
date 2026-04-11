import type { NextFunction, Request, Response } from "express";
import { distributeBodySchema } from "./aid.types.js";
import * as aidService from "./aid.service.js";
import { AppError } from "../../shared/errors/AppError.js";

export async function postDistribute(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = distributeBodySchema.parse(req.body);
    const caller = req.callerDID;
    if (!caller) {
      throw new AppError("Unauthorized", 401);
    }
    const result = await aidService.queueDistributions(caller, body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const holderDID = String(req.params.holderDID);
    const rows = await aidService.historyForHolder(holderDID);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}
