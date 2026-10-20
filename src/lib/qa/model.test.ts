import { describe, expect, it, beforeEach } from "vitest";
import {
  CHECKS,
  idsForScope,
  latestResults,
  releaseBlockers,
  simulateRun,
} from "./model";
import { useQA } from "./store";

describe("QA evidence and release rules", () => {
  beforeEach(() => {
    useQA.setState({
      build: 12,
      scope: "changed",
      selected: idsForScope("changed"),
      runs: [],
      issues: [],
      feedback: [],
      inbox: false,
      flakyReviewed: false,
      gapsAccepted: false,
      signoffs: [],
      decision: null,
    });
  });
  it("keeps a failed attempt when a retry passes and records both costs", () => {
    const run = simulateRun(12, "changed", idsForScope("changed"), false, 1);
    const flaky = run.results.find((r) => r.checkId === "C04")!;
    expect(flaky.outcome).toBe("flaky");
    expect(flaky.attempts.map((a) => a.outcome)).toEqual(["failed", "passed"]);
    expect(run.results.find((r) => r.checkId === "C03")?.attempts).toHaveLength(
      0,
    );
    expect(run.cost).toBeCloseTo(0.1152);
    expect(run.tokens).toBe(41400);
  });
  it("marks affected historical evidence stale while keeping unaffected checks valid", () => {
    const run = simulateRun(12, "changed", idsForScope("changed"), false, 1);
    const evidence = latestResults([run], 13);
    expect(evidence.get("C02")?.stale).toBe(true);
    expect(evidence.get("C05")?.stale).toBe(false);
    expect(run.results.find((r) => r.checkId === "C02")?.outcome).toBe(
      "failed",
    );
  });
  it("requires retest to resolve a fix and preserves the original run", () => {
    useQA.getState().run();
    useQA.getState().startFix();
    useQA.getState().fix();
    expect(useQA.getState().issues[0].status).toBe("fixed");
    expect(useQA.getState().issues[0].originalBuild).toBe(12);
    useQA.getState().configureInbox();
    useQA.getState().setScope("release");
    useQA.getState().run();
    const s = useQA.getState();
    expect(s.issues[0].status).toBe("resolved");
    expect(s.runs[0].results.find((r) => r.checkId === "C02")?.outcome).toBe(
      "failed",
    );
    expect(releaseBlockers(s.runs, s.build, s.issues, false)).toEqual([
      "Review the flaky response-time check.",
    ]);
  });
  it("guards approval until a current release pass, limit review and named sign-offs", () => {
    useQA.getState().decide("approved", "");
    expect(useQA.getState().decision).toBeNull();
    useQA.getState().run();
    useQA.getState().fix();
    useQA.getState().configureInbox();
    useQA.getState().setScope("release");
    useQA.getState().run();
    useQA.getState().reviewFlaky(true);
    useQA.getState().acceptGaps(true);
    for (const name of ["product", "qa", "release"])
      useQA.getState().signoff(name);
    useQA.getState().decide("approved", "Known timing limitation accepted.");
    expect(useQA.getState().decision?.kind).toBe("approved");
    useQA.getState().run();
    expect(useQA.getState().decision).toBeNull();
    expect(useQA.getState().signoffs).toEqual([]);
  });
  it("does not mistake a smaller passing selection for a release pass", () => {
    const run = simulateRun(13, "changed", idsForScope("changed"), true, 1);
    expect(releaseBlockers([run], 13, [], true)).toContain(
      "Complete the 11-check release pass on the current build.",
    );
    expect(idsForScope("release")).toHaveLength(CHECKS.length);
  });
});
