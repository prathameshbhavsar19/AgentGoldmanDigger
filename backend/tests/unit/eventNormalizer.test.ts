import { describe, it, expect } from "vitest";
import { normalizeEvent } from "../../src/services/eventNormalizer.js";

describe("eventNormalizer", () => {
  it("allows known event types", () => {
    const raw = { event_type: "activity_step_started", stepId: "s1", label: "Reading", display_message: "Reading profile" };
    const result = normalizeEvent(raw, "job-1");
    expect(result).not.toBeNull();
    expect(result?.event_type).toBe("activity_step_started");
  });

  it("drops unknown event types", () => {
    const raw = { event_type: "internal_debug_dump", secret: "some data" };
    expect(normalizeEvent(raw, "job-1")).toBeNull();
  });

  it("strips internal fields", () => {
    const raw = {
      event_type: "activity_step_started",
      stepId: "s1",
      label: "Test",
      internal_message: "SECRET",
      tool_name: "secret_tool",
    };
    const result = normalizeEvent(raw, "job-1");
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty("internal_message");
    expect(result).not.toHaveProperty("tool_name");
  });

  it("returns null for non-objects", () => {
    expect(normalizeEvent("string", "job-1")).toBeNull();
    expect(normalizeEvent(null, "job-1")).toBeNull();
    expect(normalizeEvent(42, "job-1")).toBeNull();
  });
});
