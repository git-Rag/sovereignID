import type { NextFunction, Request, Response } from "express";
import { issueCredentialBodySchema, revokeCredentialBodySchema } from "./credential.types.js";
import * as credentialService from "./credential.service.js";
import { AppError } from "../../shared/errors/AppError.js";

export async function postIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = issueCredentialBodySchema.parse(req.body);
    const caller = req.callerDID;
    if (!caller) {
      throw new AppError("Unauthorized", 401);
    }
    const result = await credentialService.issueCredential(caller, body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function getByHolder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const holderDID = String(req.params.holderDID);
    const rows = await credentialService.listCredentialsForHolder(holderDID);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function postRevoke(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = revokeCredentialBodySchema.parse(req.body);
    const caller = req.callerDID;
    if (!caller) {
      throw new AppError("Unauthorized", 401);
    }
    const updated = await credentialService.revokeCredential(caller, body);
    res.json(updated);
  } catch (e) {
    next(e);
  }
}
