import { getDb } from "../migrate.js";
import { newId } from "../../utils/ids.js";

export interface PortfolioFileRow {
  id: string;
  user_id: string;
  session_id: string;
  file_name: string;
  file_type: string | null;
  file_path: string;
  upload_status: string;
  created_at: string;
}

export interface HoldingRow {
  id: string;
  user_id: string;
  session_id: string;
  asset_name: string;
  asset_symbol: string | null;
  asset_type: string | null;
  quantity: number | null;
  market_value: number | null;
  currency: string | null;
  sector: string | null;
  region: string | null;
  created_at: string;
}

export function insertPortfolioFile(data: Omit<PortfolioFileRow, "id" | "created_at">): PortfolioFileRow {
  const db = getDb();
  const id = newId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO portfolio_files (id, user_id, session_id, file_name, file_type, file_path, upload_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.user_id, data.session_id, data.file_name, data.file_type, data.file_path, data.upload_status, now);
  return { id, ...data, created_at: now };
}

export function insertHoldings(holdings: Omit<HoldingRow, "id" | "created_at">[]): HoldingRow[] {
  const db = getDb();
  const now = new Date().toISOString();
  const insertStmt = db.prepare(`
    INSERT INTO portfolio_holdings (id, user_id, session_id, asset_name, asset_symbol, asset_type, quantity, market_value, currency, sector, region, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((rows: Omit<HoldingRow, "id" | "created_at">[]) => {
    return rows.map((h) => {
      const id = newId();
      insertStmt.run(id, h.user_id, h.session_id, h.asset_name, h.asset_symbol, h.asset_type, h.quantity, h.market_value, h.currency, h.sector, h.region, now);
      return { id, ...h, created_at: now };
    });
  });
  return insertMany(holdings);
}

export function getHoldingsBySession(sessionId: string): HoldingRow[] {
  return getDb().prepare("SELECT * FROM portfolio_holdings WHERE session_id = ?").all(sessionId) as HoldingRow[];
}
