import { Router } from "express";
import { getDb } from "../db/migrate.js";
import { cfg } from "../config.js";

const router = Router();

router.get("/", (_req, res) => {
  let dbStatus = "ok";
  try {
    getDb().prepare("SELECT 1").get();
  } catch {
    dbStatus = "error";
  }

  res.json({
    status: "ok",
    version: "1.0.0",
    time: new Date().toISOString(),
    db: dbStatus,
    ai: {
      mockPython: cfg.USE_MOCK_PYTHON,
      anthropic_model: cfg.ANTHROPIC_MODEL,
    },
  });
});

export default router;
