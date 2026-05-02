import { getDb } from "../migrate.js";
import { newId } from "../../utils/ids.js";

export interface SessionRow {
  id: string;
  user_id: string;
  primary_financial_concern: string | null;
  investment_goal: string | null;
  time_horizon: string | null;
  monthly_investment_capacity: string | null;
  emergency_savings: string | null;
  risk_reaction: string | null;
  investment_familiarity: string | null;
  current_investment_status: string | null;
  portfolio_review_intent: string | null;
  experience_tone: string | null;
  consent_given: number;
  current_step: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function createSession(userId: string): SessionRow {
  const db = getDb();
  const id = newId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO onboarding_sessions (id, user_id, consent_given, current_step, status, created_at, updated_at)
    VALUES (?, ?, 0, 'customer', 'in_progress', ?, ?)
  `).run(id, userId, now, now);
  return getSessionById(id)!;
}

export function getSessionById(id: string): SessionRow | undefined {
  return getDb().prepare("SELECT * FROM onboarding_sessions WHERE id = ?").get(id) as SessionRow | undefined;
}

export function updateSession(id: string, data: Partial<Omit<SessionRow, "id" | "created_at">>): SessionRow {
  const db = getDb();
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { ...data, updated_at: now };
  const fields = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
  db.prepare(`UPDATE onboarding_sessions SET ${fields} WHERE id = ?`).run(
    ...Object.values(updates),
    id
  );
  return getSessionById(id)!;
}
