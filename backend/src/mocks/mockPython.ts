import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { URL } from "url";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PORT = parseInt(process.env["PYTHON_PORT"] ?? "8001", 10);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

type TimelineEvent = {
  event_type: string;
  delay_ms: number;
  [key: string]: unknown;
};

// ─── Canned python_analysis_completed payloads per scenario ─────────────────

const CANNED_ANALYSIS: Record<string, object> = {
  scenario_1: {
    user_summary_md:
      "## Your Situation\n\nYou are 24 years old, just starting your career in the US, with **$300/month** to invest toward long-term wealth building. You have no existing investments — which is actually a great position to be in. Compound interest works best when you start early.\n\nCurrent macro: CPI at 3.2%, Fed funds rate at 5.25%, S&P 500 trading at a P/E of 28 (1.3σ above 10y average of 21). Index returned +24% YTD. The macro environment is moderately favourable for equity index investing.",
    portfolio_diagnosis_md:
      "You currently hold no investments. Cash savings are safe short-term, but inflation (currently 3.2%) erodes purchasing power over long horizons. Financial readiness: solid — you have a monthly surplus and a clear goal. Starting now with even $300/month compounds significantly over 10+ years.",
    options: [
      {
        id: "opt-1",
        title: "Conservative Beginner Plan",
        risk_level: "Low",
        best_for: "Users nervous about early market losses",
        content_md:
          "### Asset Allocation\n| Asset | Allocation | Monthly |\n|---|---|---|\n| Emergency fund (HYSA) | 40% | $120 |\n| Broad index fund (VOO, 0.03% expense ratio) | 40% | $120 |\n| Short-term bond fund | 20% | $60 |\n\n### Why this works\nDollar-cost averaging into a diversified equity index fund. Building an emergency buffer first reduces the chance you'll need to sell investments at the wrong time.\n\n### Pros\n- Low emotional stress\n- Builds emergency buffer first\n- Low cost (VOO: 0.03%/yr)\n\n### Cons\n- Slower wealth creation vs. full equity\n- Bond fund adds modest drag in rising-rate environment\n\n### Agent guidance\nChoose this if your biggest fear is losing money in the first 6–12 months.",
      },
      {
        id: "opt-2",
        title: "Balanced Wealth Builder",
        risk_level: "Moderate",
        best_for: "Stable income earners with a 10+ year horizon who can tolerate short-term dips",
        content_md:
          "### Asset Allocation\n| Asset | Allocation | Monthly |\n|---|---|---|\n| Broad equity index fund (FXAIX, 0.015% ER) | 70% | $210 |\n| Bond ETF (BND) | 20% | $60 |\n| Cash | 10% | $30 |\n\n### Why this works\nClassic 70/30 equity/bond split. Historically returns ~7% real annually over 10+ years.\n\n### Pros\n- Proven long-term strategy\n- Low cost\n- Diversified\n\n### Cons\n- 20-30% drawdowns in bad years (2008: -52%)\n\n### Agent guidance\nThis is the textbook first-investor strategy. Start here unless you have a specific reason not to.",
      },
      {
        id: "opt-3",
        title: "Growth-Focused Plan",
        risk_level: "Medium-High",
        best_for: "Investors who can tolerate 15–25% drawdowns without panic-selling",
        content_md:
          "### Asset Allocation\n| Asset | Allocation | Monthly |\n|---|---|---|\n| Equity index fund (VTI — total market) | 90% | $270 |\n| Cash reserve | 10% | $30 |\n\n### Why this works\nFull equity exposure maximises long-term compound returns. 10y historical CAGR for VTI: ~12%.\n\n### Pros\n- Highest long-term expected return\n- Extremely low cost (VTI: 0.03%)\n\n### Cons\n- High volatility; 2008 drawdown was -52%\n- Not suitable if you need money within 5 years\n\n### Agent guidance\nOnly choose this if a 30% paper loss won't cause you to sell.",
      },
    ],
    hidden_disclosures: [
      "VOO expense ratio: 0.03%/yr (~$0.90/yr per $3,000 invested) — extremely low.",
      "FXAIX expense ratio: 0.015%/yr — even lower; Fidelity's zero-minimum fund.",
      "BND (Vanguard Total Bond ETF): 0.03%/yr expense ratio.",
      "Short-term capital gains tax applies if any position is sold within 12 months (up to 37% in US).",
      "Past performance does not guarantee future returns. Index fund returns vary year to year.",
    ],
  },
  scenario_2: {
    user_summary_md:
      "## Your Situation\n\nYour portfolio is down 12% and you are worried about further declines. This is a stressful moment — and your instinct to act is completely understandable. But before making any moves, let's look at what the data actually shows.\n\nThe current macro environment: Fed funds rate at 5.25%, CPI at 3.2% (declining). S&P 500 stress test vs. 2020 COVID scenario shows your portfolio drawdown would have been ~28% at worst. Current -12% is within normal correction territory.",
    portfolio_diagnosis_md:
      "Your portfolio (VTI 75%, BND 25%) is broadly diversified. The -12% drawdown is consistent with a normal equity market correction. Concentration risk: LOW (single-fund exposure, diversified). Cost drag: LOW (VTI 0.03%, BND 0.03%). The real question is your time horizon: if you won't need this money for 10+ years, historically waiting has been the better choice.",
    options: [
      {
        id: "opt-1",
        title: "Hold and Rebalance Calmly",
        risk_level: "Moderate",
        best_for: "Investors with 10+ year horizon who can accept further short-term volatility",
        content_md:
          "### Asset Allocation\nMaintain current 75/25 equity/bond split. Rebalance back to target if equity drifts below 70%.\n\n### Why this works\nHistorical data: investors who held through 2008 (-52%), 2020 (-34%), and 2022 (-18%) fully recovered and went on to new highs within 2-4 years.\n\n### Pros\n- No transaction costs\n- No tax realisation event\n- Historically optimal for long horizons\n\n### Cons\n- Portfolio may fall further before recovering\n- Requires emotional discipline\n\n### Agent guidance\nIf your goal is 25 years away, this is likely the right call. Check historical stress test: worst-case 2008 GFC would have taken your portfolio to -28%, recovered by 2012.",
      },
      {
        id: "opt-2",
        title: "Defensive Shift — Reduce Equity Exposure",
        risk_level: "Low",
        best_for: "Investors who need to reduce anxiety and can accept lower long-term returns",
        content_md:
          "### Asset Allocation\n| Asset | Allocation | Change |\n|---|---|---|\n| Equity (VTI) | 50% | -25% |\n| Short-term bonds (SHY) | 30% | +5% |\n| Cash / HYSA | 20% | +20% |\n\n### Why this works\nReduces equity beta by 33%. If market falls another 20%, total portfolio loss is capped at ~10% from current level.\n\n### Pros\n- Lower anxiety, you can sleep at night\n- Limits further downside\n\n### Cons\n- Selling into a decline crystallises losses\n- STCG tax if held <12 months\n- Historically underperforms buy-and-hold over 10+ years\n\n### Agent guidance\nConsider this only if the anxiety is impairing your daily life or if your time horizon is actually shorter than 10 years.",
      },
      {
        id: "opt-3",
        title: "What If You Do Nothing — The Inertia Option",
        risk_level: "Medium-High",
        best_for: "Believers in long-term mean reversion who can stomach volatility",
        content_md:
          "### Asset Allocation\nNo change. Leave portfolio as-is and continue DCA contributions.\n\n### Why this works\nHistorical analysis: $10,000 invested in S&P 500 in January 2008 (right before the crisis) was worth $45,000 by 2024 — a 350% gain despite living through -52% drawdown.\n\n### Pros\n- Zero transaction costs, zero tax events\n- Continues DCA at lower prices (buying more units per $)\n\n### Cons\n- Could fall further — 2022 saw another -18% after initial correction\n\n### Agent guidance\nThis is the evidence-based rational choice IF your horizon is 15+ years and you won't panic-sell.",
      },
    ],
    hidden_disclosures: [
      "Selling equity positions held <12 months triggers short-term capital gains tax (up to 37% in US).",
      "Fund switching fees: VTI has no exit load, but your broker may charge a transaction fee.",
      "If you move to cash (HYSA), inflation at 3.2% erodes your real purchasing power at $3,200/yr per $100,000.",
      "SHY (iShares 1-3 Year Treasury Bond ETF): 0.15% expense ratio.",
    ],
  },
  scenario_14: {
    user_summary_md:
      "## Your Situation\n\nThe Strait of Hormuz blockage has caused oil futures to spike 18%. Let me trace the causal chain for your specific portfolio: oil up → airline jet-fuel costs rise ~25% of opex → DAL/UAL margins compress → your airline holdings (35% of portfolio) are directly in the blast radius. Second-order: FX impact on your international fund (VWIGX) as EM currencies weaken against USD. Third-order: if oil sustains above $100/bbl, CPI may bump, delaying Fed rate cuts, which would pressure QQQ's tech valuations further.\n\nCurrent commodity_price(OIL): +18% over 1 month. currency_rate(USD/INR): +2.1% over 1 month (USD strengthening). Your portfolio stress test vs. 2018_oilshock: estimated drawdown -24% from current level.",
    portfolio_diagnosis_md:
      "Portfolio holdings: DAL ($5,000 — 25%), UAL ($3,000 — 15%), QQQ ($8,000 — 40%), VWIGX ($4,000 — 20%). Concentration risk: HIGH — airlines represent 40% of portfolio. Sector concentration: Industrials (airlines) 40%, Technology 40%, International Equity 20%. Historical stress test (2018_oilshock): estimated portfolio drawdown -24%. DAL and UAL are the highest-risk positions given the current oil spike.",
    options: [
      {
        id: "opt-1",
        title: "Trim Airlines, Add Energy as Natural Hedge",
        risk_level: "Moderate",
        best_for: "Investors wanting active risk management without full defensive rotation",
        content_md:
          "### Asset Allocation\n| Asset | Allocation | Change |\n|---|---|---|\n| DAL | 10% | -15% (trim) |\n| UAL | 5% | -10% (trim) |\n| Energy ETF (XLE, 0.10% ER) | 15% | +15% (new) |\n| QQQ | 40% | unchanged |\n| VWIGX | 20% | unchanged |\n| Cash | 10% | +10% |\n\n### Why this works\nEnergy stocks (XLE) have inverse correlation to airlines in oil shocks. Reduces airline beta while adding an oil hedge.\n\n### Pros\n- Natural hedge — energy gains offset airline losses\n- Reduces single-sector concentration from 40% to 15%\n\n### Cons\n- Transaction costs + potential STCG tax on DAL/UAL sale\n- Oil shock may be transient — you may buy high/sell low\n\n### Agent guidance\nConsider this if you believe the Hormuz situation persists 3+ months. DAL's fuel hedging covers ~50% of near-term exposure per last quarterly filing.",
      },
      {
        id: "opt-2",
        title: "Defensive Rotation — Domestic Staples and Bonds",
        risk_level: "Low",
        best_for: "Risk-averse investors wanting to minimise further drawdown during geopolitical uncertainty",
        content_md:
          "### Asset Allocation\n| Asset | Allocation | Change |\n|---|---|---|\n| Consumer Staples ETF (XLP, 0.10% ER) | 25% | new |\n| Short-term US Bonds (SHY) | 20% | new |\n| Gold ETF (GLD, 0.40% ER) | 15% | new |\n| Cash | 15% | new |\n| QQQ | 25% | -15% |\n| Airlines | 0% | exit |\n\n### Why this works\nGeopolitical oil shocks historically benefit gold (+5-12%), favour domestic consumer staples, and punish airlines and international equity.\n\n### Pros\n- Significantly reduces drawdown risk\n- Gold and staples historically outperform in oil-spike scenarios\n\n### Cons\n- Selling all airlines triggers significant STCG tax\n- VWIGX exit triggers FX conversion fee (0.5-1.5%) + potential STCG\n\n### Agent guidance\nChoose this only if you have a specific near-term cash need or very low risk tolerance for geopolitical volatility.",
      },
      {
        id: "opt-3",
        title: "Hold and Monitor — Geopolitical Risk Is Historically Transient",
        risk_level: "Medium-High",
        best_for: "Long-term investors who believe supply disruptions resolve within 3-6 months",
        content_md:
          "### Asset Allocation\nNo changes. Continue monitoring.\n\n### Why this works\nHistorical precedent: 2018 oil shock (similar cause) resolved in 8 weeks. Airlines (DAL) recovered within 6 months. If you sell now, you risk missing the recovery.\n\n### Pros\n- No transaction costs\n- No tax crystallisation\n- Avoids buy-high-sell-low trap\n\n### Cons\n- Portfolio may draw down further if situation escalates\n- 2022 inflation scenario (oil sustained): QQQ fell -40%, airlines -38%\n\n### Agent guidance\nSet a stop-loss mental threshold (e.g., -35% from today) and only act if breached. Don't make permanent decisions based on temporary headlines.",
      },
    ],
    hidden_disclosures: [
      "DAL (Delta Air Lines): fuel hedging disclosed in 10-Q covers ~50% of near-term exposure at locked-in rates.",
      "UAL (United Airlines): no significant fuel hedging per last filing — full oil price exposure.",
      "QQQ expense ratio: 0.20%/yr — 6.7x higher than VOO for similar large-cap exposure.",
      "VWIGX (Vanguard International Growth): 0.43% expense ratio + currency conversion fee 0.5-1.5% on purchase/redemption.",
      "XLE (Energy Select Sector SPDR ETF): 0.10% expense ratio.",
      "Short-term capital gains tax applies if airline positions sold within 12 months (up to 37% in US).",
      "GLD (SPDR Gold Shares): 0.40% expense ratio — gold storage cost embedded in price.",
    ],
  },
};

function loadTimeline(name: string): TimelineEvent[] {
  const timelinesDir = path.join(__dirname, "timelines");
  const filePath = path.join(timelinesDir, `${name}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as TimelineEvent[];
  }
  return defaultTimeline(name);
}

function defaultTimeline(persona: string): TimelineEvent[] {
  // Determine which canned analysis to use
  const analysisKey =
    persona === "scenario_14" ? "scenario_14" :
    persona === "scenario_2" ? "scenario_2" :
    "scenario_1";

  const analysis = CANNED_ANALYSIS[analysisKey] ?? CANNED_ANALYSIS["scenario_1"];

  return [
    { event_type: "analysis_started", delay_ms: 50 },
    { event_type: "activity_step_started", delay_ms: 100, stepId: "step-1", label: "Reading your financial profile…", phase: "thinking" },
    { event_type: "activity_thought_delta", delay_ms: 150, stepId: "step-1", delta: "Reviewing your goals and risk comfort…" },
    { event_type: "activity_step_completed", delay_ms: 200, stepId: "step-1", summary: "Profile analysed." },
    { event_type: "activity_step_started", delay_ms: 250, stepId: "step-3", label: "Scanning current macro landscape…", phase: "thinking" },
    { event_type: "activity_thought_delta", delay_ms: 300, stepId: "step-3", delta: "Checking CPI, policy rate, index snapshot…" },
    { event_type: "activity_step_completed", delay_ms: 350, stepId: "step-3", summary: "Macro landscape reviewed." },
    { event_type: "activity_step_started", delay_ms: 400, stepId: "step-4", label: "Investigating key market developments…", phase: "thinking" },
    { event_type: "activity_thought_delta", delay_ms: 450, stepId: "step-4", delta: "Searching financial news for shock vectors…" },
    { event_type: "activity_step_started", delay_ms: 500, stepId: "step-7", label: "Reading fund factsheets for hidden charges…", phase: "thinking" },
    { event_type: "activity_thought_delta", delay_ms: 550, stepId: "step-7", delta: "Checking expense ratios, exit loads, lock-in periods…" },
    { event_type: "activity_step_started", delay_ms: 600, stepId: "step-9", label: "Drafting your personalised strategy options…", phase: "thinking" },
    { event_type: "activity_thought_delta", delay_ms: 700, stepId: "step-9", delta: "Synthesising research into 3 options…" },
    { event_type: "activity_step_completed", delay_ms: 800, stepId: "step-9", summary: "Research complete — options drafted." },
    {
      event_type: "python_analysis_completed",
      delay_ms: 900,
      ...analysis,
    },
  ];
}

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

const jobContexts = new Map<string, { persona: string; userJson?: unknown }>();
const activeConnections = new Map<string, WebSocket>();

app.post("/ai/jobs", (req, res) => {
  const body = req.body as { job_id?: string; jobId?: string; user_json?: { persona?: string } };
  const jobId = body.job_id ?? body.jobId ?? (req.headers["x-job-id"] as string) ?? "unknown";
  const persona = body.user_json?.persona ?? "new_investor";
  jobContexts.set(jobId, { persona, userJson: body.user_json });
  console.log(`[mockPython] job started: ${jobId} persona: ${persona}`);
  res.status(202).json({ job_id: jobId });
});

app.get("/ai/jobs/:jobId/result", (req, res) => {
  const { jobId } = req.params;
  console.log(`[mockPython] result requested for: ${jobId}`);
  res.json({ job_id: jobId, status: "completed" });
});

app.post("/ai/jobs/:jobId/follow-up", (req, res) => {
  const { jobId } = req.params;
  console.log(`[mockPython] follow-up for: ${jobId}`);
  res.json({ accepted: true });

  const ws = activeConnections.get(jobId!);
  if (ws && ws.readyState === WebSocket.OPEN) {
    setTimeout(() => {
      ws.send(JSON.stringify({ event_type: "activity_step_started", stepId: "fu1", label: "Following up on your question", phase: "thinking" }));
    }, 100);
    setTimeout(() => {
      ws.send(JSON.stringify({ event_type: "activity_step_completed", stepId: "fu1", summary: "Follow-up analysis complete." }));
    }, 500);
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "mock-python-ai" });
});

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const match = url.pathname.match(/^\/ai\/jobs\/([^/]+)\/events$/);
  if (!match) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req, match[1]);
  });
});

wss.on("connection", (ws: WebSocket, _req: http.IncomingMessage, jobId: string) => {
  console.log(`[mockPython] WS connected for job: ${jobId}`);
  activeConnections.set(jobId, ws);

  const ctx = jobContexts.get(jobId);
  const persona = ctx?.persona ?? "new_investor";
  const timeline = loadTimeline(persona);

  let offset = 0;
  timeline.forEach((event) => {
    const { delay_ms, ...payload } = event;
    offset += delay_ms;
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: event.event_type, ...payload }));
        console.log(`[mockPython] sent: ${event.event_type}`);
      }
    }, offset);
  });

  ws.on("close", () => {
    activeConnections.delete(jobId);
    console.log(`[mockPython] WS closed for job: ${jobId}`);
  });
});

server.listen(PORT, () => {
  console.log(`[mockPython] listening on port ${PORT}`);
});
