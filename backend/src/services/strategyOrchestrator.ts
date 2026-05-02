import { getSessionById } from "../db/repo/sessions.js";
import { createJob, updateJob } from "../db/repo/jobs.js";
import { getHoldingsBySession } from "../db/repo/portfolio.js";
import { mdAppender } from "./mdAppender.js";
import { pythonClient, type UserJsonSnapshot } from "./pythonClient.js";
import { logger } from "../utils/logger.js";

export const strategyOrchestrator = {
  async generate(sessionId: string): Promise<string> {
    const session = getSessionById(sessionId);
    if (!session) throw new Error("Session not found");

    const job = createJob(session.user_id, sessionId);
    updateJob(job.id, { status: "starting", started_at: new Date().toISOString() });

    const userMd = await mdAppender.snapshot(session.user_id);
    const holdings = getHoldingsBySession(sessionId);

    const userJson: UserJsonSnapshot = {
      userId: session.user_id,
      sessionId,
      investmentGoal: session.investment_goal ?? undefined,
      timeHorizon: session.time_horizon ?? undefined,
      emergencySavings: session.emergency_savings ?? undefined,
      riskReaction: session.risk_reaction ?? undefined,
      experienceTone: session.experience_tone ?? "encouraging",
      currentInvestmentStatus: session.current_investment_status ?? undefined,
      portfolioReviewIntent: session.portfolio_review_intent ?? undefined,
      persona: session.experience_tone ?? "new_investor",
    };

    try {
      await pythonClient.startJob({
        jobId: job.id,
        userMd,
        userJson,
        holdings: holdings.length > 0 ? holdings : null,
      });

      updateJob(job.id, { status: "running" });
      pythonClient.subscribeToEvents(job.id, userJson);
    } catch (e) {
      logger.error({ jobId: job.id, err: e }, "Failed to start Python job");
      updateJob(job.id, { status: "failed", error_message: String(e) });
      throw e;
    }

    return job.id;
  },
};
