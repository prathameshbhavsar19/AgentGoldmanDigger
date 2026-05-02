import fs from "fs/promises";
import { Mutex } from "async-mutex";
import { userFile } from "../utils/paths.js";

const mutexes = new Map<string, Mutex>();

function getMutex(uid: string): Mutex {
  if (!mutexes.has(uid)) mutexes.set(uid, new Mutex());
  return mutexes.get(uid)!;
}

export type SectionKey =
  | "customer"
  | "goal"
  | "horizon"
  | "capacity"
  | "emergency"
  | "risk"
  | "familiarity"
  | "status"
  | "portfolio"
  | "review_intent"
  | "consent"
  | "activity_log";

export const mdAppender = {
  async upsertSection(uid: string, key: SectionKey, body: string): Promise<void> {
    const release = await getMutex(uid).acquire();
    try {
      const filePath = userFile(uid, "user_data.md");
      let content = await fs.readFile(filePath, "utf-8");

      const open = `<!-- section:${key} -->`;
      const close = `<!-- /section:${key} -->`;
      const openIdx = content.indexOf(open);
      const closeIdx = content.indexOf(close);

      const now = new Date().toISOString();

      if (openIdx !== -1 && closeIdx !== -1) {
        content =
          content.slice(0, openIdx + open.length) +
          "\n" +
          body.trim() +
          "\n" +
          content.slice(closeIdx);
      } else {
        content += `\n\n${open}\n${body.trim()}\n${close}\n`;
      }

      // Update Last Updated line
      content = content.replace(
        /- \*\*Last Updated:\*\* .+/,
        `- **Last Updated:** ${now}`
      );

      await fs.writeFile(filePath, content, "utf-8");

      // Append to activity log section
      if (key !== "activity_log") {
        await this._appendToActivityLog(uid, content, `updated section:${key}`);
      }

      // Append audit JSONL
      const auditPath = userFile(uid, "audit.log");
      const auditLine = JSON.stringify({ ts: now, action: "upsertSection", key, uid }) + "\n";
      await fs.appendFile(auditPath, auditLine, "utf-8");
    } finally {
      release();
    }
  },

  async _appendToActivityLog(uid: string, content: string, line: string): Promise<void> {
    const filePath = userFile(uid, "user_data.md");
    const open = "<!-- section:activity_log -->";
    const close = "<!-- /section:activity_log -->";
    const openIdx = content.indexOf(open);
    const closeIdx = content.indexOf(close);
    if (openIdx === -1 || closeIdx === -1) return;

    const now = new Date().toISOString();
    const entry = `- ${now} — ${line}`;
    const newContent =
      content.slice(0, closeIdx) +
      entry +
      "\n" +
      content.slice(closeIdx);

    await fs.writeFile(filePath, newContent, "utf-8");
  },

  async appendActivity(uid: string, line: string): Promise<void> {
    const release = await getMutex(uid).acquire();
    try {
      const filePath = userFile(uid, "user_data.md");
      const content = await fs.readFile(filePath, "utf-8");
      await this._appendToActivityLog(uid, content, line);
    } finally {
      release();
    }
  },

  async snapshot(uid: string): Promise<string> {
    const filePath = userFile(uid, "user_data.md");
    return fs.readFile(filePath, "utf-8");
  },
};
