import { Router } from "express";
import { didAuth } from "../../middleware/didAuth.js";
import * as ctrl from "./aid.controller.js";

export const aidRouter = Router();

aidRouter.post("/distribute", didAuth, ctrl.postDistribute);
aidRouter.get("/history/:holderDID", ctrl.getHistory);
