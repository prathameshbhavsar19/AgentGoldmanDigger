import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import os from "os";
import fs from "fs";
import path from "path";

const dbPath = os.tmpdir() + "/test_portfolio_" + Date.now() + ".db";
const usersDir = os.tmpdir() + "/test_users_portfolio_" + Date.now();

process.env["DB_PATH"] = dbPath;
process.env["USERS_DIR"] = usersDir;
process.env["DATA_DIR"] = os.tmpdir();
process.env["NODE_ENV"] = "test";
process.env["PORT"] = "0";

const { runMigrations } = await import("../../src/db/migrate.js");
const { createServer } = await import("../../src/server.js");

let server: ReturnType<typeof createServer>;
let sessionId: string;

const csvFixture = `asset_name,symbol,asset_type,quantity,market_value,currency
Apple Inc,AAPL,Stock,10,1500.00,USD
Google LLC,GOOGL,Stock,5,750.00,USD
Vanguard S&P500,VOO,ETF,20,8000.00,USD
Microsoft Corp,MSFT,Stock,8,2400.00,USD
Tesla Inc,TSLA,Stock,3,600.00,USD
`;

beforeAll(async () => {
  runMigrations();
  server = createServer();

  const res = await request(server).post("/api/onboarding/session").send({
    userHint: { firstName: "PortfolioTest" },
  });
  sessionId = res.body.sessionId;
});

afterAll(() => {
  server.close();
  try { fs.unlinkSync(dbPath); } catch {}
  try { fs.rmSync(usersDir, { recursive: true, force: true }); } catch {}
});

describe("Portfolio upload", () => {
  it("uploads CSV and parses holdings", async () => {
    const csvPath = path.join(os.tmpdir(), "test_portfolio.csv");
    fs.writeFileSync(csvPath, csvFixture);

    const res = await request(server)
      .post("/api/portfolio/upload")
      .set("x-session-id", sessionId)
      .attach("file", csvPath, { filename: "portfolio.csv", contentType: "text/csv" });

    expect(res.status).toBe(200);
    expect(res.body.holdings.length).toBe(5);
    expect(res.body.parsed).toBe(true);
    expect(res.body.fileId).toBeTruthy();

    fs.unlinkSync(csvPath);
  });

  it("requires x-session-id header", async () => {
    const csvPath = path.join(os.tmpdir(), "test_portfolio2.csv");
    fs.writeFileSync(csvPath, csvFixture);

    const res = await request(server)
      .post("/api/portfolio/upload")
      .attach("file", csvPath, { filename: "portfolio.csv", contentType: "text/csv" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_SESSION");

    fs.unlinkSync(csvPath);
  });

  it("POST /api/portfolio/manual adds holdings", async () => {
    const res = await request(server)
      .post("/api/portfolio/manual")
      .send({
        sessionId,
        holdings: [
          { assetName: "Nifty 50 ETF", symbol: "NIFTYBEES", type: "ETF", quantity: 50, marketValue: 1000, currency: "INR" },
          { assetName: "HDFC Bank", symbol: "HDFCBANK", type: "Stock", quantity: 10, marketValue: 1500, currency: "INR" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.holdings.length).toBe(2);
    expect(res.body.holdings[0].asset_symbol).toBe("NIFTYBEES");
  });

  it("rejects unsupported file types", async () => {
    const txtPath = path.join(os.tmpdir(), "bad_file.txt");
    fs.writeFileSync(txtPath, "not a portfolio");

    const res = await request(server)
      .post("/api/portfolio/upload")
      .set("x-session-id", sessionId)
      .attach("file", txtPath, { filename: "bad.txt", contentType: "text/plain" });

    expect(res.status).toBe(400);
    fs.unlinkSync(txtPath);
  });

  it("user_data.md contains Holdings table after upload", async () => {
    const sessionRes = await request(server).get(`/api/onboarding/session/${sessionId}`);
    const userId = sessionRes.body.session.user_id;
    const mdPath = `${usersDir}/${userId}/user_data.md`;
    const content = fs.readFileSync(mdPath, "utf-8");
    expect(content).toContain("| Asset |");
    expect(content).toContain("HDFC Bank");
  });
});
