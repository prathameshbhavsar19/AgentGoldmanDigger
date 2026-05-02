import fs from "fs/promises";
import path from "path";
import { parse as csvParse } from "csv-parse/sync";
import { insertPortfolioFile, insertHoldings, type HoldingRow } from "../db/repo/portfolio.js";
import { getSessionById } from "../db/repo/sessions.js";
import { mdAppender } from "./mdAppender.js";
import { userFile } from "../utils/paths.js";

export interface ManualHoldingInput {
  assetName: string;
  symbol?: string;
  type?: string;
  quantity?: number;
  marketValue?: number;
  currency?: string;
  sector?: string;
  region?: string;
}

function holdingsToMdTable(holdings: Pick<HoldingRow, "asset_name" | "asset_symbol" | "asset_type" | "quantity" | "market_value" | "currency">[]): string {
  const header = "| Asset | Symbol | Type | Quantity | Market Value | Currency |";
  const sep = "|---|---|---|---|---|---|";
  const rows = holdings.map(
    (h) =>
      `| ${h.asset_name} | ${h.asset_symbol ?? "-"} | ${h.asset_type ?? "-"} | ${h.quantity ?? "-"} | ${h.market_value ?? "-"} | ${h.currency ?? "-"} |`
  );
  return [header, sep, ...rows].join("\n");
}

export const portfolioService = {
  async handleUpload(
    sessionId: string,
    file: Express.Multer.File
  ) {
    const session = getSessionById(sessionId);
    if (!session) throw new Error("Session not found");

    const ext = path.extname(file.originalname).toLowerCase();
    const destPath = userFile(session.user_id, `portfolio${ext}`);
    await fs.rename(file.path, destPath);

    const fileRow = insertPortfolioFile({
      user_id: session.user_id,
      session_id: sessionId,
      file_name: file.originalname,
      file_type: ext,
      file_path: destPath,
      upload_status: "uploaded",
    });

    let holdings: Omit<HoldingRow, "id" | "created_at">[] = [];
    let parsed = false;

    if (ext === ".csv" || ext === ".xlsx") {
      try {
        let csvText: string;
        if (ext === ".xlsx") {
          const XLSX = await import("xlsx");
          const wb = XLSX.readFile(destPath);
          const ws = wb.Sheets[wb.SheetNames[0]!]!;
          csvText = XLSX.utils.sheet_to_csv(ws);
        } else {
          csvText = await fs.readFile(destPath, "utf-8");
        }

        const records = csvParse(csvText, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
        holdings = records.map((r) => ({
          user_id: session.user_id,
          session_id: sessionId,
          asset_name: r["asset_name"] ?? r["Asset"] ?? r["Name"] ?? "Unknown",
          asset_symbol: r["symbol"] ?? r["Symbol"] ?? r["Ticker"] ?? null,
          asset_type: r["type"] ?? r["Type"] ?? r["AssetType"] ?? null,
          quantity: r["quantity"] ? parseFloat(r["quantity"]) : null,
          market_value: (r["market_value"] ?? r["MarketValue"]) ? parseFloat((r["market_value"] ?? r["MarketValue"])!) : null,
          currency: r["currency"] ?? r["Currency"] ?? null,
          sector: r["sector"] ?? r["Sector"] ?? null,
          region: r["region"] ?? r["Region"] ?? null,
        }));
        parsed = true;
      } catch {
        parsed = false;
      }
    }

    const insertedHoldings = holdings.length > 0 ? insertHoldings(holdings) : [];

    // Update MD portfolio section
    const mdBody =
      insertedHoldings.length > 0
        ? holdingsToMdTable(insertedHoldings)
        : `Status: file uploaded (${file.originalname}), holdings not parsed`;
    await mdAppender.upsertSection(session.user_id, "portfolio", mdBody);

    return { fileId: fileRow.id, holdings: insertedHoldings, parsed };
  },

  async handleManual(sessionId: string, holdings: ManualHoldingInput[]) {
    const session = getSessionById(sessionId);
    if (!session) throw new Error("Session not found");

    const rows: Omit<HoldingRow, "id" | "created_at">[] = holdings.map((h) => ({
      user_id: session.user_id,
      session_id: sessionId,
      asset_name: h.assetName,
      asset_symbol: h.symbol ?? null,
      asset_type: h.type ?? null,
      quantity: h.quantity ?? null,
      market_value: h.marketValue ?? null,
      currency: h.currency ?? null,
      sector: h.sector ?? null,
      region: h.region ?? null,
    }));

    const inserted = insertHoldings(rows);
    const mdBody = holdingsToMdTable(inserted);
    await mdAppender.upsertSection(session.user_id, "portfolio", mdBody);

    return { holdings: inserted };
  },
};
