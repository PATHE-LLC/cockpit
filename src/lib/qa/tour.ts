import { useQA } from "./store";

type QAState = ReturnType<typeof useQA.getState>;
let savedState: QAState | null = null;
let savedStorage: ReturnType<typeof useQA.persist.getOptions>["storage"];

export const isQATourActive = () => savedState !== null;
export async function startQATour() {
  if (savedState) return;
  await useQA.persist.rehydrate();
  if (savedState) return;
  savedState = useQA.getState();
  savedStorage = useQA.persist.getOptions().storage;
  // The tour never writes its fixture runs or decisions over the person's work.
  useQA.persist.setOptions({
    storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  });
  useQA.getState().reset();
}
export function stopQATour() {
  if (!savedState) return;
  useQA.setState(savedState, true);
  useQA.persist.setOptions({ storage: savedStorage });
  savedState = null;
  savedStorage = undefined;
  void useQA.persist.rehydrate();
}

type Stage =
  "plan" | "results" | "evidence" | "fixed" | "retry" | "release" | "decision";
export function seedQATour(stage: Stage) {
  if (!isQATourActive()) return;
  const s = useQA.getState();
  s.reset();
  if (stage === "plan") return;
  s.run();
  if (stage === "results") return;
  if (stage === "evidence") {
    s.inspectResult(1, "C02");
    return;
  }
  s.startFix();
  s.fix();
  s.configureInbox();
  if (stage === "fixed") {
    s.inspectResult(1, "C02");
    return;
  }
  s.setScope("release");
  s.run();
  if (stage === "retry") {
    s.inspectResult(2, "C04");
    return;
  }
  s.reviewFlaky(true);
  s.setTab("release");
  if (stage === "decision") {
    s.acceptGaps(true);
    s.signoff("product");
    s.signoff("qa");
    s.signoff("release");
  }
}

const step = (selector: string, stage: Stage, line: string) => ({
  path: "/qa",
  selector: `[data-tour=${selector}]`,
  line,
  prepare: () => seedQATour(stage),
});
export const QA_TOUR_STEPS = [
  step(
    "qa-overview",
    "plan",
    "Choose checks, review the results, then decide whether to release. This tour uses temporary demo data and restores your saved QA work when you leave.",
  ),
  step(
    "qa-coverage",
    "plan",
    "Start with a coverage preset. Change any checkbox before running. Quick check covers the contact form and checkout; the full release check includes all 11 tests.",
  ),
  step(
    "qa-inbox",
    "plan",
    "Setup blockers appear before the checklist. Connect a test inbox to verify delivery. You can still run without it, but that check will be marked blocked.",
  ),
  step(
    "qa-run",
    "plan",
    "Check the selection, time and estimated AI cost before starting. The run shows progress for each check. All execution here is simulated.",
  ),
  step(
    "qa-results",
    "results",
    "Use the status tabs to focus on failed, blocked or flaky checks. Select a row to open its evidence beside the list. Amber means blocked; violet means a retry needs review.",
  ),
  step(
    "qa-comparison",
    "evidence",
    "Compare the agreed expected behavior with what happened on this exact build. Captures, steps, environment and attempt logs stay with the check.",
  ),
  step(
    "qa-fix",
    "evidence",
    "Fix issue applies the demo change to a new build. The old evidence stays intact. Applying a fix does not resolve the issue until a retest passes.",
  ),
  step(
    "qa-fix",
    "fixed",
    "The fix is now in build 13. Retest fix runs the full release checklist on that build, including the changed contact form.",
  ),
  step(
    "qa-retry",
    "retry",
    "This check passed on retry. Review both attempts and accept the timing limitation before proceeding. An older run cannot satisfy the review for a newer build.",
  ),
  step(
    "qa-release-form",
    "release",
    "Review the testing limits and collect product, technical QA and release-owner sign-offs. The evidence summary shows which build each decision relies on.",
  ),
  step(
    "qa-decision",
    "decision",
    "Approve when the evidence and sign-offs are complete, or hold with a reason. These are local demo decisions; neither action deploys the project. Done restores your saved QA work.",
  ),
];
