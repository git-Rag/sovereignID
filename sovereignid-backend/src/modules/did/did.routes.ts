import { Router } from "express";
import * as ctrl from "./did.controller.js";

export const didRouter = Router();

didRouter.post("/anchor", ctrl.postAnchor);
didRouter.get("/:did", ctrl.getByDid);
