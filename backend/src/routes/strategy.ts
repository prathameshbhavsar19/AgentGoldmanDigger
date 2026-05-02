import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { strategyOrchestrator } from "../services/strategyOrchestrator.js";
import { canvasComposer } from "../services/canvasComposer.js";
import { mdAppender } from "../services/mdAppender.js";
import { insertFollowUp } from "../db/repo/followUps.js";
import { getJobById } from "../db/repo/jobs.js";
import { getSessionById } from "../db/repo/sessions.js";
import { pythonClient } from "../services/pythonClient.js";
import { logger } from "../utils/logger.js";

const router = Router();

const generateSchema = z.object({ sessionId: z.string() });
const followUpSchema = z.object({ question: z.string().min(1) });

router.post("/generate", validate(generateSchema), async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const jobId = await strategyOrchestrator.generate(sessionId);
    res.status(202).json({ jobId });
  } catch (e) {
    next(e);
  }
});

router.post("/:jobId/follow-up", validate(followUpSchema), async (req, res, next) => {
  try {
    const jobId = String(req.params["jobId"]);
    const { question } = req.body;

    const job = getJobById(jobId);
    if (!job) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Job not found" } });
      return;
    }

    insertFollowUp(jobId, question);

    const session = getSessionById(job.session_id);
    if (session) {
      await mdAppender.appendActivity(job.user_id, `Follow-up question: "${question}"`);
    }

    try {
      await pythonClient.followUp(jobId, question);
    } catch (e) {
      logger.warn({ jobId, err: e }, "Python follow-up failed (non-fatal)");
    }

    res.json({ accepted: true });
  } catch (e) {
    next(e);
  }
});

router.get("/report/:jobId", (req, res) => {
  const report = canvasComposer.getReport(String(req.params["jobId"]));
  if (!report) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Report not ready yet" } });
    return;
  }
  res.json(JSON.parse(report.final_canvas_json));
});

export default router;
