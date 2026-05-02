import { upsertModule } from "../db/repo/modules.js";
import { insertReport, getReportByJobId } from "../db/repo/reports.js";
import { getModulesByJob } from "../db/repo/modules.js";
import { updateJob } from "../db/repo/jobs.js";
import { cfg } from "../config.js";

const KNOWN_MODULE_TYPES = new Set([
  "goal_summary",
  "financial_readiness",
  "portfolio_snapshot",
  "risk_assessment",
  "strategy_options",
  "strategy_cards",
  "comparison_table",
  "important_considerations",
  "next_steps",
]);

const DISCLAIMER_MODULE = {
  type: "important_considerations",
  priority: 99,
  props: {
    items: [
      "Returns are not guaranteed.",
      "Market volatility may affect portfolio value.",
      "Expense ratios, taxes, lock-ins, and exit loads may apply.",
      "This tool is for educational and planning support. It does not place trades or guarantee investment performance.",
    ],
  },
};

export const canvasComposer = {
  handleModuleReady(jobId: string, modulePayload: unknown): { valid: boolean } {
    if (typeof modulePayload !== "object" || modulePayload === null) return { valid: false };

    const m = modulePayload as Record<string, unknown>;
    const type = (m["type"] ?? m["module_type"]) as string | undefined;

    if (!type || !KNOWN_MODULE_TYPES.has(type)) {
      return { valid: false };
    }

    const priority = (m["priority"] as number) ?? 50;
    const props = m["props"] ?? m;

    upsertModule(jobId, type, priority, { type, priority, props });
    return { valid: true };
  },

  async assembleReport(jobId: string): Promise<void> {
    const modules = getModulesByJob(jobId);
    const modulesList = modules.map((m) => ({
      ...JSON.parse(m.module_json),
      moduleId: m.id,
    }));

    // Force-include disclaimer
    const hasDisclaimer = modulesList.some((m) => m.type === "important_considerations");
    if (!hasDisclaimer) {
      upsertModule(jobId, "important_considerations", 99, DISCLAIMER_MODULE);
      modulesList.push({ ...DISCLAIMER_MODULE, moduleId: "system-disclaimer" });
    }

    modulesList.sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));

    const canvas = {
      canvas_title: "Your Personalized Portfolio Strategy",
      job_id: jobId,
      modules: modulesList,
      metadata: {
        anthropic_model: cfg.ANTHROPIC_MODEL,
        generated_at: new Date().toISOString(),
      },
    };

    insertReport({
      job_id: jobId,
      report_title: "Your Personalized Portfolio Strategy",
      ai_summary: null,
      final_canvas_json: JSON.stringify(canvas),
      metadata_json: JSON.stringify(canvas.metadata),
    });

    updateJob(jobId, { status: "completed", completed_at: new Date().toISOString() });
  },

  getReport(jobId: string) {
    return getReportByJobId(jobId);
  },
};
