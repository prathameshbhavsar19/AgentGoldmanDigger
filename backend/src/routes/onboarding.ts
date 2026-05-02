import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { onboardingService } from "../services/onboardingService.js";

const router = Router();

const startSchema = z.object({
  userHint: z
    .object({
      firstName: z.string().optional(),
      country: z.string().optional(),
      currency: z.string().optional(),
    })
    .optional(),
});

const patchSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  ageRange: z.string().optional(),
  employmentStatus: z.string().optional(),
  primaryFinancialConcern: z.string().optional(),
  investmentGoal: z.string().optional(),
  timeHorizon: z.string().optional(),
  monthlyInvestmentCapacity: z.string().optional(),
  emergencySavings: z.string().optional(),
  riskReaction: z.string().optional(),
  investmentFamiliarity: z.string().optional(),
  currentInvestmentStatus: z.string().optional(),
  portfolioReviewIntent: z.string().optional(),
  consentGiven: z.boolean().optional(),
  currentStep: z.string().optional(),
});

router.post("/session", validate(startSchema), async (req, res, next) => {
  try {
    const { session, user } = await onboardingService.startSession(req.body);
    res.status(201).json({
      sessionId: session.id,
      userId: user.id,
      currentStep: session.current_step,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/session/:sessionId", (req, res, next) => {
  try {
    const sessionId = String(req.params["sessionId"]);
    const session = onboardingService.getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Session not found" } });
      return;
    }
    res.json({ session });
  } catch (e) {
    next(e);
  }
});

router.patch("/session/:sessionId", validate(patchSchema), async (req, res, next) => {
  try {
    const updated = await onboardingService.patchSession(String(req.params["sessionId"]), req.body);
    res.json({
      sessionId: updated.id,
      currentStep: updated.current_step,
      updatedAt: updated.updated_at,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
