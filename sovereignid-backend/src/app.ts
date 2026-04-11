import express from "express";
import cors from "cors";
import helmet from "helmet";
import { getAllowedOriginsList, getEnv } from "./config/env.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { didRouter } from "./modules/did/did.routes.js";
import { issuerRouter } from "./modules/issuers/issuer.routes.js";
import { credentialRouter } from "./modules/credentials/credential.routes.js";
import { verifyRouter } from "./modules/verification/verify.routes.js";
import { aidRouter } from "./modules/aid/aid.routes.js";

export function createApp() {
  const app = express();
  getEnv();

  app.use(helmet());
  app.use(
    cors({
      origin: getAllowedOriginsList(),
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);

  app.use("/api/did", didRouter);
  app.use("/api/issuers", issuerRouter);
  app.use("/api/credentials", credentialRouter);
  app.use("/api/verify", verifyRouter);
  app.use("/api/aid", aidRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found", statusCode: 404 });
  });

  app.use(errorHandler);
  return app;
}
