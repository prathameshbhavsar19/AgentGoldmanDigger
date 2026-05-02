import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { cfg } from "../config.js";
import { logger } from "../utils/logger.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.headers["x-request-id"] as string;

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: err.flatten().fieldErrors,
        requestId,
      },
    });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error({ err, requestId, path: req.path }, message);

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: cfg.NODE_ENV === "development" ? message : "Internal server error",
      requestId,
    },
  });
}
