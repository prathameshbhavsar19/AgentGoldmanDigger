import { Router } from "express";
import multer from "multer";
import path from "path";
import os from "os";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { portfolioService } from "../services/portfolioService.js";
import { cfg } from "../config.js";

const router = Router();
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: cfg.UPLOAD_MAX_MB * 1024 * 1024 },
});

const manualSchema = z.object({
  sessionId: z.string(),
  holdings: z.array(
    z.object({
      assetName: z.string(),
      symbol: z.string().optional(),
      type: z.string().optional(),
      quantity: z.number().optional(),
      marketValue: z.number().optional(),
      currency: z.string().optional(),
      sector: z.string().optional(),
      region: z.string().optional(),
    })
  ),
});

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    const sessionId = req.headers["x-session-id"] as string;
    if (!sessionId) {
      res.status(400).json({ error: { code: "MISSING_SESSION", message: "x-session-id header required" } });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: { code: "NO_FILE", message: "No file uploaded" } });
      return;
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const allowedExts = [".csv", ".xlsx", ".pdf"];
    if (!allowedExts.includes(ext)) {
      res.status(400).json({ error: { code: "INVALID_FILE_TYPE", message: "Only CSV, XLSX, PDF allowed" } });
      return;
    }

    const result = await portfolioService.handleUpload(sessionId, req.file);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/manual", validate(manualSchema), async (req, res, next) => {
  try {
    const { sessionId, holdings } = req.body;
    const result = await portfolioService.handleManual(sessionId, holdings);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
