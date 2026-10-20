import { describe, expect, it } from "vitest";
import { TASKS } from "./tasks";

describe("daily checklist", () => {
  it("includes QA alongside the original concept tasks", () => {
    expect(TASKS.map((t) => t.id)).toEqual([
      "forme-contact-qa",
      "glenn-supabase-rls",
      "alyssa-wix-quotes",
      "model-6d-self-service",
      "recall-translation-figma",
      "three-strands-dashboard",
    ]);
  });

  it("gives each task a distinct detail and includes QA in review", () => {
    expect(new Set(TASKS.map((t) => t.statusDetail)).size).toBe(TASKS.length);
    expect(TASKS.find(t => t.id === "forme-contact-qa")?.status).toBe("needs-review");
  });
});
