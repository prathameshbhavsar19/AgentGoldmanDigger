import express from "express";
import http from "http";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { corsMiddleware } from "./middleware/cors.js";
import { requestId } from "./middleware/requestId.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { attachFrontendGateway } from "./ws/frontendGateway.js";
import healthRouter from "./routes/health.js";
import onboardingRouter from "./routes/onboarding.js";
import portfolioRouter from "./routes/portfolio.js";
import strategyRouter from "./routes/strategy.js";
import { logger } from "./utils/logger.js";

export function createServer() {
  const app = express();

  app.use(corsMiddleware);
  app.use(requestId);
  app.use(pinoHttp({ logger }));
  app.use(express.json({ limit: "2mb" }));

  const sessionLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });
  const generateLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false });

  app.use("/api/health", healthRouter);
  app.use("/api/onboarding", sessionLimiter, onboardingRouter);
  app.use("/api/portfolio", portfolioRouter);
  app.use("/api/strategy", generateLimiter, strategyRouter);

  app.use(errorHandler);

  const server = http.createServer(app);
  attachFrontendGateway(server);

  return server;
}
