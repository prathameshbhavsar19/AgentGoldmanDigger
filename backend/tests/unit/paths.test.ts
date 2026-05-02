import { describe, it, expect } from "vitest";

process.env["USERS_DIR"] = "/tmp/test_users";
process.env["DB_PATH"] = ":memory:";

const { userFile, userDir } = await import("../../src/utils/paths.js");

describe("paths traversal guard", () => {
  it("allows valid uid paths", () => {
    const p = userFile("abc-123", "user_data.md");
    expect(p).toContain("abc-123");
    expect(p).toContain("user_data.md");
  });

  it("blocks path traversal in uid", () => {
    expect(() => userFile("../../etc/passwd", "data.md")).toThrow();
  });

  it("blocks path traversal in filename", () => {
    expect(() => userFile("validuid", "../../etc/passwd")).toThrow();
  });

  it("returns absolute path", () => {
    const p = userDir("user1");
    expect(path.isAbsolute(p)).toBe(true);
  });
});

import path from "path";
