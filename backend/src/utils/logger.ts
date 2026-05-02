import pino from "pino";
import { cfg } from "../config.js";

export const logger = pino({
  level: cfg.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.apiKey",
    ],
    censor: "[REDACTED]",
  },
  transport:
    cfg.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
