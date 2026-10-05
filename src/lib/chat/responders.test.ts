import { beforeEach, describe, expect, it } from "vitest";
import { useCockpit } from "../store";
import { respond, routePrompt } from "./responders";

const initial = useCockpit.getState();
beforeEach(() => useCockpit.setState(initial, true));

describe("routePrompt", () => {
  it.each([
    ["make Glenn's reply shorter", "glenn-supabase-rls"],
    ["what's the Wix quote situation", "alyssa-wix-quotes"],
    ["push the Model 6D branch", "model-6d-self-service"],
    ["add an error state to the Recall translation frames", "recall-translation-figma"],
    ["make the 3 Strands prototype compact", "three-strands-dashboard"],
  ])("routes %s", (text, id) => expect(routePrompt(text)).toBe(id));

  it("returns null for unrelated prompts", () => {
    expect(routePrompt("hello there")).toBeNull();
  });
});

describe("Slack reply task", () => {
  it("shortens the draft and bumps the revision", () => {
    const before = useCockpit.getState().slack;
    const reply = respond("glenn-supabase-rls", "make it shorter");
    const after = useCockpit.getState().slack;
    expect(after.draft.length).toBeLessThan(before.draft.length);
    expect(after.rev).toBe(before.rev + 1);
    expect(reply.tool).toEqual({ name: "slack_draft", args: { rev: after.rev } });
  });

  it("never claims to send on its own", () => {
    const reply = respond("glenn-supabase-rls", "just send it");
    expect(reply.text).toMatch(/won't post/i);
    expect(useCockpit.getState().slack.sent).toBe(false);
  });

  it("marks the task done when the user sends", () => {
    useCockpit.getState().sendSlack();
    expect(useCockpit.getState().completed["glenn-supabase-rls"]).toBe(true);
  });
});

describe("Email task", () => {
  it("regenerates the body from the deposit answer", () => {
    useCockpit.getState().setEmailAnswers({ deposit: true });
    expect(useCockpit.getState().email.draft.body).toMatch(/convert the quote to an invoice/);
    useCockpit.getState().setEmailAnswers({ deposit: false });
    expect(useCockpit.getState().email.draft.body).toMatch(/doesn't need a deposit/);
  });

  it("keeps manual edits unless regeneration is forced", () => {
    const s = useCockpit.getState();
    s.setEmailField("body", "My own words");
    expect(s.setEmailAnswers({ tone: "formal" })).toBe(false);
    expect(useCockpit.getState().email.draft.body).toBe("My own words");
    expect(useCockpit.getState().setEmailAnswers({}, true)).toBe(true);
    expect(useCockpit.getState().email.draft.body).not.toBe("My own words");
  });
});

describe("Model 6D task", () => {
  it("makes phone required in the diff and the reply", () => {
    respond("model-6d-self-service", "make phone required");
    const { code } = useCockpit.getState();
    const schema = code.diff.find((f) => f.path.endsWith("schema.ts"))!;
    expect(schema.patch).not.toContain(".optional()");
    expect(code.reply).toMatch(/made phone required/);
  });

  it("does not push without approval", () => {
    respond("model-6d-self-service", "push it");
    expect(useCockpit.getState().code.approval).toBe("pending");
  });
});

describe("Recall Figma task", () => {
  it("adds the error frame once", () => {
    respond("recall-translation-figma", "add an error state");
    expect(useCockpit.getState().figma.frames).toHaveLength(4);
    respond("recall-translation-figma", "add an error state");
    expect(useCockpit.getState().figma.frames).toHaveLength(4);
  });

  it("switches preview language", () => {
    respond("recall-translation-figma", "show it in Japanese");
    expect(useCockpit.getState().figma.lang).toBe("ja");
  });
});

describe("3 Strands prototype task", () => {
  it("applies multiple changes in one new version", () => {
    respond("three-strands-dashboard", "make it compact with a dark theme");
    const { prototype } = useCockpit.getState();
    expect(prototype.config).toMatchObject({ density: "compact", theme: "dark" });
    expect(prototype.current).toBe(3);
  });

  it("reverts to an earlier version", () => {
    respond("three-strands-dashboard", "dark theme");
    respond("three-strands-dashboard", "revert to v2");
    const { prototype } = useCockpit.getState();
    expect(prototype.current).toBe(2);
    expect(prototype.config.theme).toBe("light");
  });

  it("adds a requirement to the PRD", () => {
    respond("three-strands-dashboard", "add a requirement for CSV export to the PRD");
    const reqs = useCockpit.getState().prd.sections.find((s) => s.id === "requirements")!;
    expect(reqs.body).toMatch(/7\. .*CSV export/i);
  });
});
