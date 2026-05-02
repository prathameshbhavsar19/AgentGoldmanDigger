import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import os from "os";
import fs from "fs";

const dbPath = os.tmpdir() + "/test_onboarding_" + Date.now() + ".db";
const usersDir = os.tmpdir() + "/test_users_onboarding_" + Date.now();

process.env["DB_PATH"] = dbPath;
process.env["USERS_DIR"] = usersDir;
process.env["DATA_DIR"] = os.tmpdir();
process.env["NODE_ENV"] = "test";
process.env["PORT"] = "0";

const { runMigrations } = await import("../../src/db/migrate.js");
const { createServer } = await import("../../src/server.js");

let server: ReturnType<typeof createServer>;

beforeAll(() => {
  runMigrations();
  server = createServer();
});

afterAll(() => {
  server.close();
  try { fs.unlinkSync(dbPath); } catch {}
  try { fs.rmSync(usersDir, { recursive: true, force: true }); } catch {}
});

describe("Onboarding flow", () => {
  let sessionId: string;
  let userId: string;

  it("POST /api/onboarding/session creates session", async () => {
    const res = await request(server).post("/api/onboarding/session").send({
      userHint: { firstName: "Alex", country: "US", currency: "USD" },
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("sessionId");
    expect(res.body).toHaveProperty("userId");
    sessionId = res.body.sessionId;
    userId = res.body.userId;
  });

  it("PATCH customer details updates session", async () => {
    const res = await request(server)
      .patch(`/api/onboarding/session/${sessionId}`)
      .send({ firstName: "Alex", country: "US", currency: "USD", ageRange: "25-34", employmentStatus: "Full-time employed", currentStep: "goal" });
    expect(res.status).toBe(200);
    expect(res.body.currentStep).toBe("goal");
  });

  it("PATCH goal updates session", async () => {
    const res = await request(server)
      .patch(`/api/onboarding/session/${sessionId}`)
      .send({ investmentGoal: "Wealth creation", currentStep: "horizon" });
    expect(res.status).toBe(200);
  });

  it("PATCH all remaining steps", async () => {
    const steps = [
      { timeHorizon: "5-10 years", currentStep: "capacity" },
      { monthlyInvestmentCapacity: "$250-$750", currentStep: "emergency" },
      { emergencySavings: "3-6 months of expenses", currentStep: "risk" },
      { riskReaction: "Review the reason and decide", currentStep: "familiarity" },
      { investmentFamiliarity: "I know a few terms but have not started", currentStep: "status" },
      { currentInvestmentStatus: "No, I have not invested yet", currentStep: "review" },
      { consentGiven: true, currentStep: "review" },
    ];
    for (const patch of steps) {
      const res = await request(server).patch(`/api/onboarding/session/${sessionId}`).send(patch);
      expect(res.status).toBe(200);
    }
  });

  it("GET session returns all answers", async () => {
    const res = await request(server).get(`/api/onboarding/session/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.session.investment_goal).toBe("Wealth creation");
    expect(res.body.session.consent_given).toBe(1);
  });

  it("user_data.md reflects all sections", async () => {
    const mdPath = `${usersDir}/${userId}/user_data.md`;
    const content = fs.readFileSync(mdPath, "utf-8");
    expect(content).toContain("Wealth creation");
    expect(content).toContain("5-10 years");
    expect(content).toContain("Version v1");
  });
});
