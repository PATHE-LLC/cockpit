export type Scope = "changed" | "risk" | "release";
export type Outcome = "passed" | "failed" | "blocked" | "flaky";
export type QATab = "plan" | "results" | "issues" | "release";

export const SCOPES: {
  id: Scope;
  title: string;
  description: string;
  estimate: string;
}[] = [
  {
    id: "changed",
    title: "Changed + critical",
    description: "Contact form changes and a checkout smoke test.",
    estimate: "~2 min",
  },
  {
    id: "risk",
    title: "Broader coverage",
    description: "Add validation, accessibility and mobile layout.",
    estimate: "~4 min",
  },
  {
    id: "release",
    title: "Release pass",
    description: "All 11 checks agreed for this demo release.",
    estimate: "~6 min",
  },
];

export interface Check {
  id: string;
  title: string;
  area: string;
  runner: "AI browser" | "Playwright" | "Unit test";
  scope: Scope;
  expected: string;
  steps: string;
  device: string;
  affected: boolean;
}

export const CHECKS: Check[] = [
  {
    id: "C01",
    title: "Send a message",
    area: "Contact",
    runner: "Playwright",
    scope: "changed",
    expected: "One message is saved and a confirmation appears.",
    steps: "Enter valid contact details and press Send message once.",
    device: "Desktop",
    affected: true,
  },
  {
    id: "C02",
    title: "Keep message after a failure",
    area: "Contact",
    runner: "AI browser",
    scope: "changed",
    expected:
      "The message stays in the form after a network error, ready to retry.",
    steps:
      "Enter a message, simulate an offline connection, submit, then restore the connection.",
    device: "Desktop",
    affected: true,
  },
  {
    id: "C03",
    title: "Confirm inbox delivery",
    area: "Contact",
    runner: "AI browser",
    scope: "changed",
    expected: "The submitted message arrives in the test inbox exactly once.",
    steps: "Submit the form and inspect the configured test inbox.",
    device: "Desktop",
    affected: true,
  },
  {
    id: "C04",
    title: "Confirmation response time",
    area: "Contact",
    runner: "AI browser",
    scope: "changed",
    expected: "A confirmation appears within 2 seconds.",
    steps: "Submit the form and time the response; preserve every attempt.",
    device: "Desktop",
    affected: true,
  },
  {
    id: "C05",
    title: "Checkout smoke test",
    area: "Checkout",
    runner: "Playwright",
    scope: "changed",
    expected: "A guest can add a product and reach the payment step.",
    steps:
      "Add the linen tote to the cart and continue as a guest. Do not make a payment.",
    device: "Desktop",
    affected: false,
  },
  {
    id: "C06",
    title: "Reject invalid email",
    area: "Contact",
    runner: "Unit test",
    scope: "risk",
    expected: "An invalid email displays a field error and is not submitted.",
    steps: "Submit with shopper@ and inspect validation.",
    device: "Desktop",
    affected: true,
  },
  {
    id: "C07",
    title: "Contact form on mobile",
    area: "Contact",
    runner: "AI browser",
    scope: "risk",
    expected:
      "Fields and actions fit the viewport without horizontal scrolling.",
    steps: "Inspect the form at 390 × 844, including its error state.",
    device: "Mobile",
    affected: true,
  },
  {
    id: "C08",
    title: "Labels and keyboard access",
    area: "Contact",
    runner: "Playwright",
    scope: "risk",
    expected:
      "Every field is labelled and the form can be completed using the keyboard.",
    steps:
      "Tab through fields, check accessible names, then submit using Enter.",
    device: "Desktop",
    affected: true,
  },
  {
    id: "C09",
    title: "Prevent duplicate submission",
    area: "Contact",
    runner: "Playwright",
    scope: "release",
    expected: "Repeated clicks while sending create only one message.",
    steps:
      "Double-click Send while the request is pending and count saved messages.",
    device: "Desktop",
    affected: true,
  },
  {
    id: "C10",
    title: "Empty cart recovery",
    area: "Cart",
    runner: "Playwright",
    scope: "release",
    expected: "An empty cart links back to shopping.",
    steps: "Remove the last item and follow Continue shopping.",
    device: "Mobile",
    affected: false,
  },
  {
    id: "C11",
    title: "Product browsing",
    area: "Catalog",
    runner: "AI browser",
    scope: "release",
    expected: "Product details and prices remain readable on mobile.",
    steps: "Open a product from the catalog at 390 × 844.",
    device: "Mobile",
    affected: false,
  },
];

export const idsForScope = (scope: Scope) =>
  CHECKS.filter(
    (c) =>
      scope === "release" ||
      c.scope === "changed" ||
      (scope === "risk" && c.scope === "risk"),
  ).map((c) => c.id);
export const estimatedCost = (ids: string[]) =>
  ids.filter((id) => CHECKS.find((c) => c.id === id)?.runner === "AI browser")
    .length * 0.14;

export interface Attempt {
  outcome: "passed" | "failed";
  duration: string;
  log: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}
export interface Result {
  checkId: string;
  outcome: Outcome;
  actual: string;
  attempts: Attempt[];
}
export interface Run {
  id: number;
  build: number;
  scope: Scope;
  selected: string[];
  results: Result[];
  cost: number;
  tokens: number;
  created: string;
}
export interface Feedback {
  id: string;
  build: number;
  category: string;
  description: string;
  expected: string;
  actual: string;
  annotation: boolean;
  page: string;
  device: string;
}
export interface Issue {
  id: string;
  title: string;
  status: "open" | "in-progress" | "fixed" | "resolved";
  checkId: string;
  originalBuild: number;
  fixedBuild?: number;
}

export function simulateRun(
  build: number,
  scope: Scope,
  selected: string[],
  inbox: boolean,
  id: number,
): Run {
  const results: Result[] = CHECKS.filter((c) => selected.includes(c.id)).map(
    (check) => {
      if (check.id === "C03" && !inbox)
        return {
          checkId: check.id,
          outcome: "blocked",
          actual: "No test inbox configured. Delivery could not be verified.",
          attempts: [],
        };
      const failed = check.id === "C02" && build === 12;
      const flaky = check.id === "C04";
      const ai = check.runner === "AI browser";
      const attempt = (pass: boolean, retry = false): Attempt => ({
        outcome: pass ? "passed" : "failed",
        duration: flaky && !retry ? "2.8s" : "1.1s",
        log: !pass
          ? failed
            ? "POST /contact → 503\nform.reset() called before request completes\nAssertion failed: message field is empty"
            : "POST /contact → 200\nConfirmation visible after 2800ms\nAssertion failed: exceeded 2000ms threshold"
          : `${check.runner}: ${check.steps}\nAssertion passed: ${check.expected}${retry ? "\nRetry #1; initial timeout retained" : ""}`,
        inputTokens: ai ? 12000 : 0,
        outputTokens: ai ? 1800 : 0,
        cost: ai ? 0.0384 : 0,
      });
      return {
        checkId: check.id,
        outcome: failed ? "failed" : flaky ? "flaky" : "passed",
        actual: failed
          ? "The error appears, but the message field is cleared. The customer must start again."
          : flaky
            ? "First attempt: 2.8s (failed). Retry: 1.1s (passed). Needs human review."
            : check.expected,
        attempts: flaky
          ? [attempt(false), attempt(true, true)]
          : [attempt(!failed)],
      };
    },
  );
  const attempts = results.flatMap((r) => r.attempts);
  return {
    id,
    build,
    scope,
    selected: [...selected],
    results,
    cost: attempts.reduce((n, a) => n + a.cost, 0),
    tokens: attempts.reduce((n, a) => n + a.inputTokens + a.outputTokens, 0),
    created: new Date().toISOString(),
  };
}

export function latestResults(runs: Run[], build: number) {
  const results = new Map<
    string,
    { result: Result; run: Run; stale: boolean }
  >();
  for (const run of runs)
    for (const result of run.results)
      results.set(result.checkId, {
        result,
        run,
        stale:
          run.build !== build &&
          Boolean(CHECKS.find((c) => c.id === result.checkId)?.affected),
      });
  return results;
}

export function releaseBlockers(
  runs: Run[],
  build: number,
  issues: Issue[],
  flakyReviewed: boolean,
): string[] {
  const latest = latestResults(runs, build);
  const blockers: string[] = [];
  if (
    !runs.some(
      (r) =>
        r.build === build && CHECKS.every((c) => r.selected.includes(c.id)),
    )
  )
    blockers.push("Complete the 11-check release pass on the current build.");
  if ([...latest.values()].some((r) => r.stale))
    blockers.push("Retest the stale evidence.");
  if (
    [...latest.values()].some(
      (r) =>
        !r.stale &&
        (r.result.outcome === "failed" || r.result.outcome === "blocked"),
    )
  )
    blockers.push("Resolve the failed or blocked checks.");
  if (issues.some((i) => i.status !== "resolved"))
    blockers.push("Fix and verify the open issues.");
  if (
    [...latest.values()].some((r) => r.result.outcome === "flaky") &&
    !flakyReviewed
  )
    blockers.push("Review the flaky response-time check.");
  return blockers;
}
