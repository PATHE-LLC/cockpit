import { describe, expect, it } from "vitest";
import { TASKS } from "./tasks";
import { docsInScope, namedProject, PROJECTS } from "./library";

describe("library", () => {
  it("keeps company, client, and project documents on one shelf", () => {
    expect(docsInScope("company").map((doc) => doc.title)).toEqual([
      "Project flow SOP",
      "Proposal SOP",
      "Contract template",
      "Brand",
    ]);
    expect(docsInScope("client:solar-light").map((doc) => doc.title)).toEqual([
      "Solar Light note",
      "Site map",
      "Homepage frames",
      "Content inventory",
      "Form spec",
      "Field list",
    ]);
    expect(docsInScope("project:three-strands").every((doc) => doc.scopeId === "three-strands")).toBe(true);
  });

  it("names a project only when the conversation names one", () => {
    expect(namedProject("Solar Light wants a shorter site")).toBeNull();
    expect(namedProject("the Solar Light website redesign")).toBe("Website Redesign");
    expect(namedProject("update the RMA form")).toBe("RMA Form");
    expect(namedProject("3 strands dashboard")).toBe("3 Strands dashboard");
  });

  it("attaches only the obvious tasks", () => {
    const attached = Object.fromEntries(TASKS.map((task) => [task.id, task.project ?? ""]));
    expect(attached).toEqual({
      "glenn-supabase-rls": "",
      "alyssa-wix-quotes": "",
      "model-6d-self-service": "RMA Form",
      "recall-translation-figma": "",
      "three-strands-dashboard": "3 Strands dashboard",
    });
    expect(PROJECTS.find((project) => project.name === "3 Strands dashboard")?.clientId).toBeUndefined();
  });
});
