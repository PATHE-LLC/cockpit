import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useQA } from "./store";
import { isQATourActive, seedQATour, startQATour, stopQATour } from "./tour";

beforeEach(() => {
  stopQATour();
  localStorage.clear();
  useQA.setState(useQA.getInitialState());
  useQA.getState().run();
});
afterEach(stopQATour);

describe("the isolated QA guided tour", () => {
  it("does not persist its fixtures and restores the person's runs and decision", async () => {
    useQA.getState().decide("held", "Waiting for review");
    const original = useQA.getState();
    const stored = localStorage.getItem("cockpit-qa-v1");
    await startQATour();
    seedQATour("decision");
    expect(isQATourActive()).toBe(true);
    expect(useQA.getState().build).toBe(13);
    expect(useQA.getState().signoffs).toHaveLength(3);
    expect(localStorage.getItem("cockpit-qa-v1")).toBe(stored);
    stopQATour();
    expect(isQATourActive()).toBe(false);
    expect(useQA.getState().runs).toEqual(original.runs);
    expect(useQA.getState().decision).toEqual(original.decision);
    expect(localStorage.getItem("cockpit-qa-v1")).toBe(stored);
  });

  it("supports stepping backward without duplicate runs or losing original evidence", async () => {
    await startQATour();
    seedQATour("retry");
    expect(useQA.getState().runs.map((run) => run.build)).toEqual([12, 13]);
    expect(useQA.getState().issues[0].status).toBe("resolved");
    seedQATour("evidence");
    expect(useQA.getState().runs).toHaveLength(1);
    expect(useQA.getState().build).toBe(12);
    expect(useQA.getState().issues[0].status).toBe("open");
    expect(useQA.getState().evidenceOpen).toBe(true);
  });

  it("retains one original snapshot when the tour starts twice", async () => {
    const original = useQA.getState().runs;
    await Promise.all([startQATour(), startQATour()]);
    seedQATour("release");
    stopQATour();
    expect(useQA.getState().runs).toEqual(original);
    useQA.getState().configureInbox();
    expect(JSON.parse(localStorage.getItem("cockpit-qa-v1")!).state.inbox).toBe(
      true,
    );
  });
});

it("keeps changes saved by another tab while the tour is open", async () => {
  await startQATour();
  seedQATour("decision");
  const external = JSON.parse(localStorage.getItem("cockpit-qa-v1")!);
  external.state.inbox = true;
  localStorage.setItem("cockpit-qa-v1", JSON.stringify(external));
  stopQATour();
  expect(useQA.getState().inbox).toBe(true);
  expect(useQA.getState().build).toBe(12);
});
