import { Router } from "express";
import * as ctrl from "./verify.controller.js";

export const verifyRouter = Router();

verifyRouter.post("/proof", ctrl.postVerifyProof);
