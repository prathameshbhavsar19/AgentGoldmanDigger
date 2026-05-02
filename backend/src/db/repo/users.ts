import { getDb } from "../migrate.js";
import { newId } from "../../utils/ids.js";

export interface UserRow {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  country: string | null;
  currency: string | null;
  age_range: string | null;
  employment_status: string | null;
  user_folder_path: string | null;
  created_at: string;
}

export function createUser(data: Partial<Omit<UserRow, "id" | "created_at">>): UserRow {
  const db = getDb();
  const id = newId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO users (id, first_name, last_name, email, country, currency, age_range, employment_status, user_folder_path, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.first_name ?? "Guest",
    data.last_name ?? null,
    data.email ?? null,
    data.country ?? null,
    data.currency ?? "USD",
    data.age_range ?? null,
    data.employment_status ?? null,
    data.user_folder_path ?? null,
    now
  );
  return getUserById(id)!;
}

export function getUserById(id: string): UserRow | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export function updateUser(id: string, data: Partial<UserRow>): void {
  const db = getDb();
  const fields = Object.entries(data)
    .filter(([k]) => k !== "id" && k !== "created_at")
    .map(([k]) => `${k} = ?`);
  if (fields.length === 0) return;
  db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(
    ...Object.values(data).filter((_, i) => !["id", "created_at"].includes(Object.keys(data)[i]!)),
    id
  );
}
