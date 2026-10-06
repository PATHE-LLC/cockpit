import { describe, expect, it } from "vitest";
import { TASKS } from "./tasks";

describe("daily checklist", () => {
  it("contains the five concept tasks in order", () => {
    expect(TASKS.map((t) => t.id)).toEqual([
      "glenn-supabase-rls",
      "alyssa-wix-quotes",
      "model-6d-self-service",
      "recall-translation-figma",
      "three-strands-dashboard",
    ]);
  });

  it("gives every task a distinct, task-specific state", () => {
    expect(new Set(TASKS.map((t) => t.statusDetail)).size).toBe(TASKS.length);
    expect(new Set(TASKS.map((t) => t.status)).size).toBe(TASKS.length);
  });
});
