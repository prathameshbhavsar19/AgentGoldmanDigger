import type { Request, Response, NextFunction } from "express";
import { newId } from "../utils/ids.js";

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers["x-request-id"] as string) ?? newId();
  req.headers["x-request-id"] = id;
  res.setHeader("x-request-id", id);
  next();
}
