import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import os from "os";

// We need to override USERS_DIR to a temp dir for tests
process.env["USERS_DIR"] = os.tmpdir() + "/test_users_" + Date.now();
process.env["DB_PATH"] = ":memory:";

const { mdAppender } = await import("../../src/services/mdAppender.js");
const { userFolder } = await import("../../src/services/userFolder.js");

describe("mdAppender", () => {
  const uid = "test-user-" + Date.now();

  beforeEach(async () => {
    await userFolder.create(uid, "test-session-1");
  });

  afterEach(async () => {
    const { userDir } = await import("../../src/utils/paths.js");
    try {
      await fs.rm(userDir(uid), { recursive: true, force: true });
    } catch {}
  });

  it("upserts a section idempotently", async () => {
    await mdAppender.upsertSection(uid, "goal", "**Selected:** Wealth creation");
    const first = await mdAppender.snapshot(uid);
    await mdAppender.upsertSection(uid, "goal", "**Selected:** Retirement");
    const second = await mdAppender.snapshot(uid);

    expect(first).toContain("Wealth creation");
    expect(second).toContain("Retirement");
    expect(second).not.toContain("Wealth creation");
  });

  it("appends to activity log without duplicating sections", async () => {
    await mdAppender.appendActivity(uid, "test event 1");
    await mdAppender.appendActivity(uid, "test event 2");
    const snap = await mdAppender.snapshot(uid);
    expect(snap).toContain("test event 1");
    expect(snap).toContain("test event 2");
  });

  it("handles concurrent writes safely", async () => {
    const promises = Array.from({ length: 5 }, (_, i) =>
      mdAppender.upsertSection(uid, "capacity", `**Selected:** Option ${i}`)
    );
    await Promise.all(promises);
    const snap = await mdAppender.snapshot(uid);
    const count = (snap.match(/<!-- section:capacity -->/g) ?? []).length;
    expect(count).toBe(1);
  });

  it("writes audit log", async () => {
    await mdAppender.upsertSection(uid, "risk", "**Selected:** Hold");
    const { userFile } = await import("../../src/utils/paths.js");
    const auditPath = userFile(uid, "audit.log");
    const auditContent = await fs.readFile(auditPath, "utf-8");
    expect(auditContent).toContain("upsertSection");
  });
});
