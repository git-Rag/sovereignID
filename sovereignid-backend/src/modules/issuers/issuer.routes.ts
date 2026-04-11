import { Router } from "express";
import * as ctrl from "./issuer.controller.js";

export const issuerRouter = Router();

issuerRouter.post("/register", ctrl.postRegister);
issuerRouter.get("/:did", ctrl.getByDid);
