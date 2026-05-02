import type { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export function validate<T>(schema: ZodSchema<T>, source: "body" | "params" | "query" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    req[source] = result.data as never;
    next();
  };
}
