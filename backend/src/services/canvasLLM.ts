/**
 * Node.js canvas demystifier + builder LLM.
 *
 * Receives Python's structured FinalAnalysis JSON, calls claude-sonnet-4-6 to:
 *  1. Demystify financial jargon in each option (inline replacements + glossary extraction)
 *  2. Structure the result into frontend-renderable canvas modules
 *
 * Returns an array of CanvasModule objects ready for canvasComposer.handleModuleReady.
 */
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { cfg } from "../config.js";
import { CANVAS_DEMYSTIFIER_SYSTEM, CANVAS_PROMPT_VERSION } from "./canvasLLM.prompts.js";
import { startJobTrace, type UserJsonSnapshot } from "./langfuseClient.js";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PythonStrategyOption {
  id: string;
  title: string;
  risk_level: string;
  best_for: string;
  content_md: string;
}

export interface PythonAnalysis {
  user_summary_md: string;
  portfolio_diagnosis_md: string;
  options: PythonStrategyOption[];
  hidden_disclosures: string[];
}

export interface CanvasModule {
  type: string;
  priority: number;
  props: Record<string, unknown>;
}

// ─── JSON extraction ────────────────────────────────────────────────────────

/**
 * Scan from `start` (must be at "{") forward, tracking string state, and
 * return the substring up to the matching closing "}".
 */
function scanJsonObject(text: string, start: number): string | null {
  if (start >= text.length || text[start] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
    } else {
      if (ch === '"') inString = true;
      else if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

/**
 * Extract a JSON object from LLM output. Tries:
 *   1. ```json ... ``` code fence
 *   2. Anchor on a known schema key ("modules"), walk back to opening "{"
 *   3. Try every "{" from the end until one parses
 */
function extractJson(text: string): Record<string, unknown> {
  // Strategy 1: ```json ... ``` code fence
  const fenceMatch = /```(?:json)?\s*\n([\s\S]*?)\n```/.exec(text);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch {
      /* fall through */
    }
  }

  // Strategy 2: anchor on the schema's required key
  const anchor = '"modules"';
  const anchorIdx = text.indexOf(anchor);
  if (anchorIdx !== -1) {
    for (let start = anchorIdx; start >= 0; start--) {
      if (text[start] === "{") {
        const candidate = scanJsonObject(text, start);
        if (candidate) {
          try {
            return JSON.parse(candidate);
          } catch {
            /* try earlier brace */
          }
        }
      }
    }
  }

  // Strategy 3: try every `{` from the end
  const indices: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") indices.push(i);
  }
  for (let i = indices.length - 1; i >= 0; i--) {
    const candidate = scanJsonObject(text, indices[i]);
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      /* try earlier */
    }
  }

  throw new Error(`No valid JSON object found in LLM output. Raw: ${text.slice(0, 300)}`);
}

// ─── Main export ───────────────────────────────────────────────────────────

/** Deterministic fallback when Anthropic API key is not configured (tests / offline). */
function buildFallbackCanvas(python: PythonAnalysis): CanvasModule[] {
  const modules: CanvasModule[] = [
    {
      type: "goal_summary",
      priority: 1,
      props: { headline: python.user_summary_md.slice(0, 120), horizon: "Long term", tone: "Beginner-friendly" },
    },
    {
      type: "risk_diagnosis",
      priority: 2,
      props: { diagnosis_plain: python.portfolio_diagnosis_md, key_concerns: [] },
    },
    {
      type: "strategy_options",
      priority: 5,
      props: {
        options: python.options.map((o) => ({
          id: o.id,
          title: o.title,
          risk_level: o.risk_level,
          risk_tint: o.risk_level === "Low" ? "low" : o.risk_level === "Moderate" ? "moderate" : "high",
          summary_plain: o.best_for,
          best_for_plain: o.best_for,
          details_md_plain: o.content_md,
          allocation: [],
          pros: [],
          cons: [],
          agent_guidance_plain: "",
        })),
      },
    },
    {
      type: "glossary",
      priority: 6,
      props: {
        terms: [
          { term: "Expense ratio", plain_definition: "The annual fee a fund charges, expressed as a percentage.", example: "0.03% on a $10,000 investment = $3/yr." },
          { term: "Dollar-cost averaging", plain_definition: "Investing the same amount monthly regardless of price.", example: "$300/mo for 12 months smooths out highs and lows." },
          { term: "Drawdown", plain_definition: "The percentage drop from a portfolio's peak value.", example: "A -20% drawdown means your $10,000 fell to $8,000." },
        ],
      },
    },
    {
      type: "important_considerations",
      priority: 7,
      props: {
        items: python.hidden_disclosures.map((d) => ({ verbatim: d, plain_meaning: "" })),
      },
    },
    {
      type: "next_steps",
      priority: 8,
      props: { actions: ["Review the options above.", "Pick the path that matches your risk comfort.", "Start small and review every 3 months."] },
    },
  ];
  return modules;
}

export async function buildCanvasFromAnalysis(
  jobId: string,
  python: PythonAnalysis,
  userJson: UserJsonSnapshot,
): Promise<CanvasModule[]> {
  // Fallback when no API key or running against mock Python (tests, offline environments)
  if (!cfg.ANTHROPIC_API_KEY || cfg.USE_MOCK_PYTHON) {
    return buildFallbackCanvas(python);
  }

  const llm = new ChatAnthropic({
    model: cfg.ANTHROPIC_MODEL,
    apiKey: cfg.ANTHROPIC_API_KEY,
    // Use streaming mode so the Anthropic SDK doesn't reject high-token
    // requests with "Streaming is required for operations >10 min".
    // LangChain accumulates the stream and returns the full message.
    streaming: true,
    maxTokens: 32000,
    temperature: 0,
  });

  // Wire up Langfuse if configured
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let callbacks: any[] = [];
  try {
    if (cfg.LANGFUSE_PUBLIC_KEY && cfg.LANGFUSE_SECRET_KEY) {
      const { CallbackHandler } = require("langfuse-langchain") as typeof import("langfuse-langchain");
      const trace = startJobTrace(jobId, userJson);
      if (trace) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handler = new (CallbackHandler as any)({
          root: trace,
          metadata: { span_name: "node_canvas_llm", prompt_version: CANVAS_PROMPT_VERSION },
        });
        callbacks = [handler];
      }
    }
  } catch {
    // Langfuse optional — proceed without
  }

  const inputPayload = JSON.stringify(
    {
      user_summary_md: python.user_summary_md,
      portfolio_diagnosis_md: python.portfolio_diagnosis_md,
      options: python.options,
      hidden_disclosures: python.hidden_disclosures,
      has_holdings: python.options.some((o) =>
        o.content_md.toLowerCase().includes("allocation"),
      ),
    },
    null,
    2,
  );

  const messages = [
    new SystemMessage(CANVAS_DEMYSTIFIER_SYSTEM),
    new HumanMessage(inputPayload),
  ];

  const response = await llm.invoke(messages, {
    callbacks: callbacks.length > 0 ? callbacks : undefined,
  });

  // Anthropic content can be either a string or a list of typed blocks like
  // [{type:"text",text:"..."}, {type:"tool_use",...}]. We need to concatenate
  // every text block into a single string before extracting JSON.
  const contentToText = (content: unknown): string => {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .map((block) => {
          if (typeof block === "string") return block;
          if (block && typeof block === "object" && (block as { type?: string }).type === "text") {
            return (block as { text?: string }).text ?? "";
          }
          return "";
        })
        .join("");
    }
    return "";
  };

  const rawText = contentToText(response.content);

  // Persist for offline debugging on failure
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const debugDir = process.env.CANVAS_DEBUG_DIR ?? "/tmp/canvas_llm_debug";
    await fs.mkdir(debugDir, { recursive: true });
    await fs.writeFile(path.join(debugDir, `${jobId}.txt`), rawText);
  } catch {
    /* best-effort */
  }

  const raw = extractJson(rawText);
  const modules = (raw.modules as CanvasModule[]) ?? [];
  modules.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  return modules;
}
