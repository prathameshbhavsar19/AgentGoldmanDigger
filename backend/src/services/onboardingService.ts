import { createUser, updateUser } from "../db/repo/users.js";
import { createSession, getSessionById, updateSession, type SessionRow } from "../db/repo/sessions.js";
import { userFolder } from "./userFolder.js";
import { mdAppender, type SectionKey } from "./mdAppender.js";
import { newId } from "../utils/ids.js";
import { getDb } from "../db/migrate.js";

export interface OnboardingStartInput {
  userHint?: {
    firstName?: string;
    country?: string;
    currency?: string;
  };
}

export interface OnboardingPatchInput {
  // Customer
  firstName?: string;
  lastName?: string;
  email?: string;
  country?: string;
  currency?: string;
  ageRange?: string;
  employmentStatus?: string;
  primaryFinancialConcern?: string;
  // Goal
  investmentGoal?: string;
  // Horizon
  timeHorizon?: string;
  // Capacity
  monthlyInvestmentCapacity?: string;
  // Emergency
  emergencySavings?: string;
  // Risk
  riskReaction?: string;
  // Familiarity
  investmentFamiliarity?: string;
  // Status
  currentInvestmentStatus?: string;
  // Intent
  portfolioReviewIntent?: string;
  // Consent
  consentGiven?: boolean;
  // Step
  currentStep?: string;
}

function deriveExperienceTone(familiarity: string | undefined): string {
  if (!familiarity) return "encouraging";
  const f = familiarity.toLowerCase();
  if (f.includes("never") || f.includes("few terms")) return "encouraging";
  if (f.includes("advisor") || f.includes("choose some")) return "explanatory";
  return "analytical";
}

function sectionBodyForPatch(patch: OnboardingPatchInput): Partial<Record<SectionKey, string>> {
  const sections: Partial<Record<SectionKey, string>> = {};

  if (
    patch.firstName ||
    patch.lastName ||
    patch.country ||
    patch.currency ||
    patch.ageRange ||
    patch.employmentStatus ||
    patch.primaryFinancialConcern
  ) {
    sections.customer = [
      patch.firstName ? `- **First Name:** ${patch.firstName}` : "",
      patch.lastName ? `- **Last Name:** ${patch.lastName}` : "",
      patch.country ? `- **Country:** ${patch.country}` : "",
      patch.currency ? `- **Currency:** ${patch.currency}` : "",
      patch.ageRange ? `- **Age Range:** ${patch.ageRange}` : "",
      patch.employmentStatus ? `- **Employment:** ${patch.employmentStatus}` : "",
      patch.primaryFinancialConcern
        ? `- **Primary Concern:** ${patch.primaryFinancialConcern}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (patch.investmentGoal)
    sections.goal = `**Selected:** ${patch.investmentGoal}`;
  if (patch.timeHorizon)
    sections.horizon = `**Selected:** ${patch.timeHorizon}\n<!-- tone:${patch.timeHorizon.includes("10") ? "long_term" : "short_term"} -->`;
  if (patch.monthlyInvestmentCapacity)
    sections.capacity = `**Selected:** ${patch.monthlyInvestmentCapacity}`;
  if (patch.emergencySavings)
    sections.emergency =
      `**Selected:** ${patch.emergencySavings}` +
      (patch.emergencySavings === "none" ? "\n<!-- safety_first:true -->" : "");
  if (patch.riskReaction) {
    const tone = patch.riskReaction.toLowerCase().includes("sell")
      ? "stability"
      : patch.riskReaction.toLowerCase().includes("more")
      ? "growth"
      : "balanced";
    sections.risk = `**Selected:** ${patch.riskReaction}\n<!-- risk_tone:${tone} -->`;
  }
  if (patch.investmentFamiliarity) {
    const exp = deriveExperienceTone(patch.investmentFamiliarity);
    sections.familiarity = `**Selected:** ${patch.investmentFamiliarity}\n<!-- experience:${exp} -->`;
  }
  if (patch.currentInvestmentStatus)
    sections.status = `**Selected:** ${patch.currentInvestmentStatus}`;
  if (patch.portfolioReviewIntent)
    sections.review_intent = `**Selected:** ${patch.portfolioReviewIntent}`;
  if (patch.consentGiven)
    sections.consent = `**Given at:** ${new Date().toISOString()} — Version v1`;

  return sections;
}

export const onboardingService = {
  async startSession(input: OnboardingStartInput) {
    const user = createUser({
      first_name: input.userHint?.firstName ?? "Guest",
      country: input.userHint?.country ?? null,
      currency: input.userHint?.currency ?? "USD",
    });
    const session = createSession(user.id);
    const folderPath = await userFolder.create(user.id, session.id);
    updateUser(user.id, { user_folder_path: folderPath });
    return { session, user };
  },

  getSession(sessionId: string) {
    return getSessionById(sessionId);
  },

  async patchSession(sessionId: string, patch: OnboardingPatchInput) {
    const session = getSessionById(sessionId);
    if (!session) throw new Error("Session not found");

    const dbUpdate: Partial<SessionRow> = {};
    if (patch.primaryFinancialConcern)
      dbUpdate.primary_financial_concern = patch.primaryFinancialConcern;
    if (patch.investmentGoal) dbUpdate.investment_goal = patch.investmentGoal;
    if (patch.timeHorizon) dbUpdate.time_horizon = patch.timeHorizon;
    if (patch.monthlyInvestmentCapacity)
      dbUpdate.monthly_investment_capacity = patch.monthlyInvestmentCapacity;
    if (patch.emergencySavings) dbUpdate.emergency_savings = patch.emergencySavings;
    if (patch.riskReaction) dbUpdate.risk_reaction = patch.riskReaction;
    if (patch.investmentFamiliarity) {
      dbUpdate.investment_familiarity = patch.investmentFamiliarity;
      dbUpdate.experience_tone = deriveExperienceTone(patch.investmentFamiliarity);
    }
    if (patch.currentInvestmentStatus)
      dbUpdate.current_investment_status = patch.currentInvestmentStatus;
    if (patch.portfolioReviewIntent)
      dbUpdate.portfolio_review_intent = patch.portfolioReviewIntent;
    if (patch.consentGiven !== undefined)
      dbUpdate.consent_given = patch.consentGiven ? 1 : 0;
    if (patch.currentStep) dbUpdate.current_step = patch.currentStep;

    // Also update user table from customer fields
    if (patch.firstName || patch.lastName || patch.email || patch.country || patch.currency || patch.ageRange || patch.employmentStatus) {
      updateUser(session.user_id, {
        first_name: patch.firstName,
        last_name: patch.lastName,
        email: patch.email,
        country: patch.country,
        currency: patch.currency,
        age_range: patch.ageRange,
        employment_status: patch.employmentStatus,
      });
    }

    const updated = updateSession(sessionId, dbUpdate);

    // Write MD sections
    const sections = sectionBodyForPatch(patch);
    for (const [key, body] of Object.entries(sections)) {
      await mdAppender.upsertSection(session.user_id, key as SectionKey, body);
    }

    // Audit
    const auditEntry = {
      id: newId(),
      session_id: sessionId,
      action: "patch",
      patch_json: JSON.stringify(patch),
      created_at: new Date().toISOString(),
    };
    getDb()
      .prepare("INSERT INTO session_audit (id, session_id, action, patch_json, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(auditEntry.id, auditEntry.session_id, auditEntry.action, auditEntry.patch_json, auditEntry.created_at);

    return updated;
  },
};
