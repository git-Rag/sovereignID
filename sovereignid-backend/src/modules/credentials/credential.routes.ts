import { Router } from "express";
import { didAuth } from "../../middleware/didAuth.js";
import * as ctrl from "./credential.controller.js";

export const credentialRouter = Router();

credentialRouter.post("/issue", didAuth, ctrl.postIssue);
credentialRouter.post("/revoke", didAuth, ctrl.postRevoke);
credentialRouter.get("/:holderDID", ctrl.getByHolder);
