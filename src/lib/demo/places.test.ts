import { describe, expect, it } from "vitest";
import { PROJECTS } from "./library";
import { itemsFor, memoryTags, sectionsFor } from "./places";

describe("places", () => {
  it("starts every project flat, with one extra section on Cockpit OS", () => {
    for (const project of PROJECTS) {
      expect(sectionsFor(project.id).map((section) => section.title).slice(0, 3)).toEqual([
        "Overview",
        "Files & links",
        "Project memory",
      ]);
    }
    expect(sectionsFor("cockpit-os").map((section) => section.title)).toContain("Voice");
    expect(PROJECTS.filter((project) => !project.clientId).map((project) => project.id).sort()).toEqual([
      "cockpit-os",
      "three-strands",
    ]);
  });

  it("keeps project memory as one tagged list", () => {
    const items = itemsFor("cockpit-memory");
    const meetings = items.filter((item) => item.tags?.includes("Meeting"));
    expect(meetings).toHaveLength(2);
    expect(meetings.filter((item) => item.tags?.includes("Transcript"))).toHaveLength(1);
    expect(items.some((item) => item.tags?.includes("Decision"))).toBe(true);
    expect(memoryTags("cockpit-memory")).toEqual(["Meeting", "Transcript", "Decision"]);
    expect(itemsFor("website-files").some((item) => item.href?.includes("figma"))).toBe(true);
  });

  it("uses the same shape for team and the client", () => {
    expect(sectionsFor("company").map((section) => section.title)).toEqual(["Overview", "Processes", "Resources"]);
    expect(sectionsFor("solar-light").map((section) => section.title)).toEqual(["Overview", "Client memory"]);
    expect(itemsFor("solar-memory").length).toBeGreaterThan(0);
  });
});
