"use client";

import { useState } from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleDashedIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  Loader2Icon,
  PlayIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  XCircleIcon,
  CheckIcon,
  Clock3Icon,
  MonitorIcon,
  SmartphoneIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CHECKS,
  SCOPES,
  estimatedCost,
  latestResults,
  releaseBlockers,
  type Outcome,
  type Run,
} from "@/lib/qa/model";
import { useQA } from "@/lib/qa/store";
import { cn } from "@/lib/utils";
import { ContactSnapshot } from "./contact-preview";

const money = (value: number) => `$${value.toFixed(2)}`;
const LABELS: Record<Outcome | "stale" | "not-tested", string> = {
  passed: "Passed",
  failed: "Failed",
  blocked: "Blocked",
  flaky: "Flaky",
  stale: "Stale",
  "not-tested": "Not tested",
};

function Status({ status }: { status: Outcome | "stale" | "not-tested" }) {
  const Icon =
    status === "passed"
      ? CheckCircle2Icon
      : status === "failed"
        ? XCircleIcon
        : status === "not-tested" || status === "stale"
          ? CircleDashedIcon
          : TriangleAlertIcon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-xs",
        status === "passed"
          ? "text-brand"
          : status === "failed"
            ? "text-destructive"
            : status === "not-tested"
              ? "text-muted-foreground"
              : "text-warn",
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {LABELS[status]}
    </span>
  );
}

function SectionHeading({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-medium">{children}</h3>
      {detail && (
        <span className="text-xs text-muted-foreground">{detail}</span>
      )}
    </div>
  );
}

export function RunPlan({
  running,
  onRun,
}: {
  running: boolean;
  onRun: () => void;
}) {
  const s = useQA();
  const [showAll, setShowAll] = useState(false);
  const omitted = CHECKS.filter((c) => !s.selected.includes(c.id));
  const visible = CHECKS.filter((c) => showAll || s.selected.includes(c.id));
  const scope = SCOPES.find((scope) => scope.id === s.scope)!;
  const blocked = s.selected.includes("C03") && !s.inbox;
  return (
    <div>
      <div className="mb-8">
        <p className="qa-eyebrow mb-2">TEST PLAN</p>
        <h2 className="qa-heading">Review your test plan.</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The contact form changed in this build. Start there, then check the
          buying journey.
        </p>
      </div>
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_272px] xl:gap-12">
        <div className="min-w-0">
          <fieldset disabled={running} className="mb-8 min-w-0">
            <legend className="mb-3 text-xs font-medium text-muted-foreground">
              Coverage
            </legend>
            <select
              aria-label="Coverage"
              value={s.scope}
              onChange={(e) => {
                const scope = SCOPES.find((item) => item.id === e.target.value);
                if (scope) s.setScope(scope.id);
              }}
              className="qa-select min-h-11 w-full text-sm sm:hidden"
            >
              {SCOPES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <div className="qa-scope-group hidden gap-1 rounded-lg bg-muted/60 p-1 sm:grid sm:grid-cols-3">
              {SCOPES.map((item) => (
                <label
                  key={item.id}
                  className={cn(
                    "relative flex cursor-pointer items-center gap-2 rounded-md px-3 py-3 text-sm",
                    s.scope === item.id
                      ? "bg-background font-medium shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name="qa-scope"
                    value={item.id}
                    checked={s.scope === item.id}
                    onChange={() => s.setScope(item.id)}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-md peer-focus-visible:ring-2 peer-focus-visible:ring-brand" />
                  {item.id === "changed"
                    ? "Changed + critical"
                    : item.id === "risk"
                      ? "Risk-based"
                      : "Release pass"}
                  {s.scope === item.id && (
                    <CheckIcon
                      aria-hidden
                      className="ml-auto size-3.5 text-brand"
                    />
                  )}
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {scope.description}
            </p>
          </fieldset>
          <section aria-label="Selected checks">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                Checks to run{" "}
                <span className="qa-count">{s.selected.length}</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                disabled={running}
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-muted-foreground"
              >
                {showAll ? "Show selected" : "Edit selection"}
              </Button>
            </div>
            <fieldset disabled={running} className="min-w-0 divide-y border-y">
              <legend className="sr-only">Choose checks for this run</legend>
              {visible.map((check) => (
                <div
                  key={check.id}
                  className="qa-check-row flex items-start gap-3 py-4"
                >
                  <Checkbox
                    checked={s.selected.includes(check.id)}
                    onCheckedChange={() => s.toggleCheck(check.id)}
                    className="mt-1"
                    aria-label={`Include ${check.title}`}
                  />
                  <details className="group/check min-w-0 flex-1">
                    <summary className="flex cursor-pointer list-none items-start gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm leading-6">
                          {check.title}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono text-[11px]">
                            {check.id}
                          </span>
                          <span aria-hidden>·</span>
                          {check.area}
                          <span aria-hidden>·</span>
                          {check.device}
                        </span>
                      </div>
                      <span className="hidden pt-1.5 text-[11px] text-muted-foreground sm:block">
                        {check.runner === "AI browser"
                          ? "AI-assisted"
                          : "Coded"}
                      </span>
                      <ChevronRightIcon
                        aria-hidden
                        className="mt-1.5 size-3.5 shrink-0 text-muted-foreground group-open/check:rotate-90"
                      />
                    </summary>
                    <dl className="mt-4 space-y-3 border-l pl-4 text-xs leading-5">
                      <div>
                        <dt className="font-medium">Steps</dt>
                        <dd className="mt-1 text-muted-foreground">
                          {check.steps}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium">
                          Expected result · agreed requirement
                        </dt>
                        <dd className="mt-1 text-muted-foreground">
                          {check.expected}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium">Why this check</dt>
                        <dd className="mt-1 text-muted-foreground">
                          {check.affected
                            ? "Verifies the changed contact form and its recovery behavior."
                            : "Protects a critical shopping journey outside the changed area."}{" "}
                          Runner: {check.runner}.
                        </dd>
                      </div>
                    </dl>
                  </details>
                </div>
              ))}
              {!visible.length && (
                <p className="py-8 text-sm text-muted-foreground">
                  No checks selected. Choose Edit selection to add checks.
                </p>
              )}
            </fieldset>
          </section>
          <details className="mt-5 text-xs leading-5 text-muted-foreground">
            <summary className="cursor-pointer py-2">
              {omitted.length} checks outside this run · coverage limits
            </summary>
            <ul className="mt-3 space-y-2">
              {omitted.map((check) => (
                <li key={check.id}>
                  {check.id} · {check.title}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              This checklist excludes real payments, production delivery,
              comprehensive security testing and additional browsers. A passing
              run only verifies the selected checks.
            </p>
          </details>
        </div>
        <aside
          aria-label="Run details"
          className="qa-run-details rounded-xl border bg-muted/20 p-5 xl:sticky xl:top-0"
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-medium">Run details</h3>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-brand" />
              Staging
            </span>
          </div>
          <dl className="space-y-4 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Target build</dt>
              <dd className="font-mono">forme / b{s.build}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Checks</dt>
              <dd className="tabular-nums">
                {s.selected.length} of {CHECKS.length}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Est. duration</dt>
              <dd className="flex items-center gap-1.5 tabular-nums">
                <Clock3Icon aria-hidden className="size-3" />
                {s.selected.length ? scope.estimate : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Est. AI cost</dt>
              <dd className="font-medium tabular-nums">
                {money(estimatedCost(s.selected))}
              </dd>
            </div>
          </dl>
          <div className="my-5 space-y-2 border-y py-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <MonitorIcon aria-hidden className="size-3.5" />
              Desktop · Chrome
            </p>
            {s.selected.some(
              (id) => CHECKS.find((c) => c.id === id)?.device === "Mobile",
            ) && (
              <p className="flex items-center gap-2">
                <SmartphoneIcon aria-hidden className="size-3.5" />
                Mobile viewport · 390 × 844
              </p>
            )}
            <p className="pt-1">Guest shopper · demo account</p>
          </div>
          {blocked ? (
            <div className="mb-5 text-xs leading-5">
              <p className="flex items-center gap-2 font-medium">
                <TriangleAlertIcon aria-hidden className="size-3.5 text-warn" />
                One setup blocker
              </p>
              <p className="mt-2 text-muted-foreground">
                Inbox delivery needs a test inbox. The other checks can run.
              </p>
              <Button
                variant="link"
                size="sm"
                disabled={running}
                onClick={s.configureInbox}
                className="mt-2 h-auto p-0 text-xs text-brand"
              >
                Set up demo inbox <ArrowRightIcon />
              </Button>
            </div>
          ) : s.inbox ? (
            <p className="mb-5 flex items-center gap-2 text-xs text-brand">
              <CheckCircle2Icon aria-hidden className="size-3.5" />
              Demo inbox connected
            </p>
          ) : null}
          <Button
            onClick={onRun}
            disabled={running || !s.selected.length}
            className="qa-primary w-full"
          >
            {running ? (
              <Loader2Icon aria-hidden className="motion-safe:animate-spin" />
            ) : (
              <PlayIcon aria-hidden className="size-3.5" />
            )}
            {running ? "Running checks…" : `Run ${s.selected.length} checks`}
          </Button>
          <p className="mt-3 text-center text-[11px] leading-4 text-muted-foreground">
            Estimate includes retries.
            <br />
            Local simulation · nothing is sent.
          </p>
        </aside>
      </div>
    </div>
  );
}

export function Results({
  onRun,
  running,
}: {
  onRun: () => void;
  running: boolean;
}) {
  const s = useQA();
  const [filter, setFilter] = useState("all");
  const run = s.runs.find((r) => r.id === s.activeRun) ?? s.runs.at(-1);
  if (!run)
    return (
      <Empty
        title="Your results will appear here."
        description="Review the plan and run your first checks. Every result keeps its build, evidence and attempt history."
        action="Review test plan"
        onClick={() => s.setTab("plan")}
      />
    );
  const visible = run.results.filter(
    (result) =>
      filter === "all" ||
      result.outcome === filter ||
      (filter === "stale" &&
        run.build !== s.build &&
        CHECKS.find((c) => c.id === result.checkId)?.affected),
  );
  const selected =
    visible.find((r) => r.checkId === s.activeCheck) ?? visible[0];
  const check = CHECKS.find((c) => c.id === selected?.checkId);
  const stale = Boolean(run.build !== s.build && check?.affected);
  const latestCheck = check && latestResults(s.runs, s.build).get(check.id);
  const canReviewAttempts = !stale && latestCheck?.run.id === run.id;
  const counts = (status: Outcome) =>
    run.results.filter((r) => r.outcome === status).length;
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="qa-eyebrow mb-2">
            RUN {String(run.id).padStart(2, "0")} · BUILD {run.build}
          </p>
          <h2 className="qa-heading">
            {counts("failed") || counts("blocked")
              ? "Here’s what needs attention."
              : "Checks complete. Ready to review."}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {run.selected.length} checks · {money(run.cost)} recorded AI spend ·
            every attempt preserved
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Run history"
            value={run.id}
            onChange={(e) =>
              s.selectResult(Number(e.target.value), s.activeCheck)
            }
            className="qa-select"
          >
            {[...s.runs].reverse().map((r) => (
              <option key={r.id} value={r.id}>
                Run {r.id} · build {r.build}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => s.setTab("release")}
          >
            Review release <ArrowRightIcon />
          </Button>
        </div>
      </div>
      {run.build !== s.build && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warn-soft/60 px-4 py-3 text-xs leading-5">
          <p>
            Build {s.build} is current. Affected results below are stale;
            original evidence is preserved.
          </p>
          <Button size="sm" variant="ghost" disabled={running} onClick={onRun}>
            Retest selection <ArrowRightIcon />
          </Button>
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-y py-4">
        {(["passed", "failed", "blocked", "flaky"] as Outcome[]).map(
          (status) => (
            <span key={status} className="flex items-center gap-2">
              <span className="text-sm font-medium tabular-nums">
                {counts(status)}
              </span>
              <Status status={status} />
            </span>
          ),
        )}
        <span className="text-xs text-muted-foreground sm:ml-auto">
          {CHECKS.length - run.selected.length} not tested in this run
        </span>
      </div>
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(240px,.8fr)_minmax(0,1.4fr)] lg:gap-8">
        <section aria-label="Test results" className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium">
              Checks{" "}
              <span className="ml-1 text-muted-foreground">
                {visible.length}
              </span>
            </h3>
            <select
              aria-label="Filter results"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="qa-select border-0 bg-transparent text-xs"
            >
              <option value="all">All results</option>
              {(["failed", "blocked", "flaky", "passed", "stale"] as const).map(
                (status) => (
                  <option key={status} value={status}>
                    {LABELS[status]}
                  </option>
                ),
              )}
            </select>
          </div>
          {visible.length > 0 && (
            <select
              aria-label="Select check to inspect"
              value={selected?.checkId ?? ""}
              onChange={(e) => s.selectResult(run.id, e.target.value)}
              className="qa-select w-full lg:hidden"
            >
              {visible.map((result) => (
                <option key={result.checkId} value={result.checkId}>
                  {result.checkId} ·{" "}
                  {CHECKS.find((c) => c.id === result.checkId)?.title}
                </option>
              ))}
            </select>
          )}
          <div className="hidden space-y-1 lg:block">
            {visible.map((result) => {
              const c = CHECKS.find((c) => c.id === result.checkId)!;
              return (
                <button
                  key={c.id}
                  aria-pressed={c.id === selected?.checkId}
                  onClick={() => s.selectResult(run.id, c.id)}
                  className={cn(
                    "qa-result-row flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-brand",
                    c.id === selected?.checkId && "border-border bg-muted/60",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm leading-5">{c.title}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {c.id}
                      </span>
                      <Status
                        status={
                          run.build !== s.build && c.affected
                            ? "stale"
                            : result.outcome
                        }
                      />
                    </span>
                  </div>
                  <ChevronRightIcon
                    aria-hidden
                    className="size-3.5 shrink-0 text-muted-foreground"
                  />
                </button>
              );
            })}
            {!visible.length && (
              <p className="py-8 text-sm text-muted-foreground">
                No {filter} checks in this run. Choose All results to see the
                evidence.
              </p>
            )}
          </div>
          {!visible.length && (
            <p className="py-5 text-sm text-muted-foreground lg:hidden">
              No {filter} checks in this run. Choose All results to see the
              evidence.
            </p>
          )}
          <div className="mt-5 border-t pt-4">
            <RunCost run={run} />
          </div>
        </section>
        {selected && check && (
          <section
            aria-label={`Evidence for ${check.title}`}
            className="min-w-0 rounded-xl border p-5 sm:p-6"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">
                {check.id} · BUILD {run.build}
              </span>
              <Status status={stale ? "stale" : selected.outcome} />
            </div>
            <h3 className="mb-5 text-lg font-medium tracking-tight">
              {check.title}
            </h3>
            <dl className="space-y-5 text-sm leading-6">
              <div>
                <dt className="mb-1 text-xs font-medium text-muted-foreground">
                  Expected · agreed requirement
                </dt>
                <dd>{check.expected}</dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-medium text-muted-foreground">
                  Actual
                </dt>
                <dd>{selected.actual}</dd>
              </div>
            </dl>
            <details className="mt-4 text-xs leading-5 text-muted-foreground">
              <summary className="cursor-pointer py-1">
                Test steps · {check.runner} · {check.device}
              </summary>
              <p className="mt-2">{check.steps}</p>
            </details>
            {check.id === "C02" && selected.outcome !== "blocked" && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-[11px] text-muted-foreground">
                    Original failure · b12
                  </p>
                  <ContactSnapshot build={12} annotation />
                </div>
                <div>
                  <p className="mb-2 text-[11px] text-muted-foreground">
                    {run.build === 12
                      ? "Expected behavior"
                      : "Verified fix · b13"}
                  </p>
                  <ContactSnapshot build={13} expected={run.build === 12} />
                </div>
              </div>
            )}
            <div className="mt-5 space-y-2">
              {selected.attempts.map((attempt, i) => (
                <details key={i} className="rounded-lg bg-muted/50 p-3 text-xs">
                  <summary className="cursor-pointer leading-5">
                    {i ? `Retry ${i}` : "Attempt 1"} · {attempt.outcome} ·{" "}
                    {attempt.duration} · {money(attempt.cost)}
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap break-words font-mono leading-relaxed">
                    {attempt.log}
                  </pre>
                  <p className="mt-3 text-muted-foreground">
                    {attempt.inputTokens.toLocaleString()} input ·{" "}
                    {attempt.outputTokens.toLocaleString()} output tokens
                  </p>
                </details>
              ))}
            </div>
            {selected.outcome === "blocked" && (
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={s.configureInbox}
                  disabled={s.inbox}
                >
                  {s.inbox ? "Demo inbox ready" : "Set up demo inbox"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => s.setTab("plan")}
                >
                  Review plan & rerun <ArrowRightIcon />
                </Button>
              </div>
            )}
            {check.id === "C02" && s.issues.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-5"
                onClick={() => s.setTab("issues")}
              >
                View linked issue · QA-104 <ArrowRightIcon />
              </Button>
            )}
            {selected.outcome === "flaky" && (
              <label className="mt-5 flex items-start gap-3 text-xs leading-5">
                <Checkbox
                  className="mt-0.5"
                  checked={canReviewAttempts && s.flakyReviewed}
                  disabled={!canReviewAttempts}
                  onCheckedChange={s.reviewFlaky}
                />
                {canReviewAttempts
                  ? "I reviewed both attempts. Track response timing as a known limitation."
                  : "Review both attempts in the latest run on the current build before accepting this limitation."}
              </label>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function RunCost({ run }: { run: Run }) {
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-muted-foreground">
        Recorded AI usage · {money(run.cost)} · {run.tokens.toLocaleString()}{" "}
        tokens · includes retries
      </summary>
      <div className="mt-3 space-y-2 rounded-lg bg-muted/50 p-4">
        {run.results
          .filter((r) => r.attempts.some((a) => a.inputTokens))
          .map((result) => (
            <div className="flex justify-between gap-3" key={result.checkId}>
              <span>
                {result.checkId} · {result.attempts.length} attempt
                {result.attempts.length !== 1 ? "s" : ""}
              </span>
              <span className="tabular-nums">
                {money(result.attempts.reduce((n, a) => n + a.cost, 0))}
              </span>
            </div>
          ))}
        <p className="pt-2 text-muted-foreground">
          Simulated recorded usage, not provider telemetry. Fixture rates: $2/M
          input, $8/M output. Coded checks use no AI tokens.
        </p>
      </div>
    </details>
  );
}

export function Issues({ openPreview }: { openPreview: () => void }) {
  const s = useQA();
  const issue = s.issues[0];
  if (!issue)
    return (
      <Empty
        title="No issues to work through."
        description="Run the checks to find problems, or open the storefront to test the contact form and capture feedback."
        action="Open storefront"
        onClick={openPreview}
      />
    );
  const status =
    issue.status === "fixed"
      ? "Needs retest"
      : issue.status === "in-progress"
        ? "In progress"
        : issue.status === "resolved"
          ? "Resolved"
          : "Open";
  return (
    <div>
      <p className="qa-eyebrow mb-2">COCKPIT TRACKER · {issue.id}</p>
      <h2 className="qa-heading max-w-2xl">{issue.title}</h2>
      <div className="mb-8 mt-3 flex flex-wrap items-center gap-3 text-xs">
        <span
          className={cn(
            "rounded-md bg-muted px-2 py-1",
            issue.status === "resolved" && "bg-brand-soft text-brand",
          )}
        >
          {status}
        </span>
        <span className="text-muted-foreground">
          Contact form · First seen on build {issue.originalBuild}
        </span>
      </div>
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_272px] xl:gap-12">
        <div className="min-w-0 space-y-7">
          <section>
            <SectionHeading>What’s happening</SectionHeading>
            <p className="text-sm leading-6 text-muted-foreground">
              A failed request resets the form before the customer can retry.
              Keep the message until the request succeeds.
            </p>
            <dl className="mt-5 grid gap-5 rounded-lg bg-muted/40 p-4 text-sm leading-6 sm:grid-cols-2">
              <div>
                <dt className="mb-1 text-xs text-muted-foreground">Expected</dt>
                <dd>
                  The customer’s message stays in the form, ready to retry.
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs text-muted-foreground">
                  Actual · build {issue.originalBuild}
                </dt>
                <dd>The error appears and the message field is empty.</dd>
              </div>
            </dl>
          </section>
          <section className="border-t pt-5">
            <SectionHeading detail="Original evidence preserved">
              Test evidence
            </SectionHeading>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const run = s.runs.find((r) =>
                  r.results.some((result) => result.checkId === "C02"),
                );
                if (run) {
                  s.selectResult(run.id, "C02");
                  s.setTab("results");
                } else openPreview();
              }}
            >
              C02 · Keep message after a failure <ArrowRightIcon />
            </Button>
            <details className="mt-4 text-xs text-muted-foreground">
              <summary className="cursor-pointer py-2">
                View original capture · build {issue.originalBuild}
              </summary>
              <div className="mt-3 max-w-sm">
                <ContactSnapshot build={issue.originalBuild} annotation />
              </div>
            </details>
          </section>
          <section className="border-t pt-5">
            <SectionHeading
              detail={`${s.feedback.length} linked report${s.feedback.length === 1 ? "" : "s"}`}
            >
              Human feedback
            </SectionHeading>
            {s.feedback.length ? (
              <div className="space-y-3">
                {s.feedback.map((f) => (
                  <details key={f.id} className="rounded-lg border p-4">
                    <summary className="cursor-pointer text-sm">
                      {f.id} · {f.category}
                      <span className="ml-3 text-xs text-muted-foreground">
                        Build {f.build}
                      </span>
                    </summary>
                    <p className="mt-4 text-sm leading-6">{f.description}</p>
                    <dl className="mt-4 space-y-3 text-xs leading-5">
                      <div>
                        <dt className="text-muted-foreground">Expected</dt>
                        <dd>{f.expected}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Actual</dt>
                        <dd>{f.actual}</dd>
                      </div>
                    </dl>
                    <p className="mt-4 text-[11px] text-muted-foreground">
                      {f.page} · {f.device} · Original capture retained
                    </p>
                    <div className="mt-4 max-w-xs">
                      <ContactSnapshot
                        build={f.build}
                        annotation={f.annotation}
                      />
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs leading-5 text-muted-foreground">
                  Try the form and attach a tester’s report to this issue.
                </p>
                <Button variant="outline" size="sm" onClick={openPreview}>
                  Capture feedback <ExternalLinkIcon />
                </Button>
              </div>
            )}
          </section>
          {issue.status === "in-progress" && (
            <section className="border-t pt-5">
              <SectionHeading>Proposed fix</SectionHeading>
              <p className="mb-4 text-sm text-muted-foreground">
                Reset the form only after a successful response.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-muted/50 p-4 text-xs leading-7">
                <code>
                  <span className="text-destructive">- form.reset();</span>
                  {"\n  const response = await sendMessage(values);\n"}
                  <span className="text-brand">
                    + if (response.ok) form.reset();
                  </span>
                </code>
              </pre>
            </section>
          )}
        </div>
        <aside
          aria-label="Issue progress"
          className="rounded-xl border bg-muted/20 p-5 xl:sticky xl:top-0"
        >
          <h3 className="mb-6 text-sm font-medium">Fix & verify</h3>
          <ol className="space-y-5 text-xs leading-5">
            {[
              {
                title: "Failure captured",
                detail: `Build ${issue.originalBuild} · original evidence saved`,
                done: true,
              },
              {
                title: "Prepare a fix",
                detail: "Preserve the message on failure",
                done: issue.status !== "open",
              },
              {
                title: "New build",
                detail: issue.fixedBuild
                  ? `Build ${issue.fixedBuild} · affected evidence is stale`
                  : "Changes need a new build",
                done: Boolean(issue.fixedBuild),
              },
              {
                title: "Retest & resolve",
                detail:
                  issue.status === "resolved"
                    ? "Build 13 · verification passed"
                    : "A passing retest resolves the issue",
                done: issue.status === "resolved",
              },
            ].map((step, i) => (
              <li key={step.title} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[10px]",
                    step.done
                      ? "border-brand/20 bg-brand-soft text-brand"
                      : "text-muted-foreground",
                  )}
                >
                  {step.done ? (
                    <CheckIcon aria-hidden className="size-3" />
                  ) : (
                    i + 1
                  )}
                </span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-1 text-muted-foreground">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 border-t pt-5">
            {issue.status === "open" && (
              <Button className="qa-primary w-full" onClick={s.startFix}>
                <GitBranchIcon />
                Prepare a fix
              </Button>
            )}
            {issue.status === "in-progress" && (
              <Button className="qa-primary w-full" onClick={s.fix}>
                Apply demo fix · build 13 <ArrowRightIcon />
              </Button>
            )}
            {issue.status === "fixed" && (
              <>
                <p className="mb-4 text-xs leading-5 text-muted-foreground">
                  The fix is ready. Verify it on build 13 before resolving the
                  issue.
                </p>
                <Button
                  className="qa-primary w-full"
                  onClick={() => {
                    s.setScope("release");
                    s.setTab("plan");
                  }}
                >
                  Prepare release retest <ArrowRightIcon />
                </Button>
              </>
            )}
            {issue.status === "resolved" && (
              <>
                <p className="mb-4 flex items-center gap-2 text-xs text-brand">
                  <CheckCircle2Icon className="size-3.5" />
                  Fix verified on build 13
                </p>
                <Button
                  className="qa-primary w-full"
                  onClick={() => s.setTab("release")}
                >
                  Review release <ArrowRightIcon />
                </Button>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ReleaseReview() {
  const s = useQA();
  const [note, setNote] = useState(s.decision?.note ?? "");
  const blockers = releaseBlockers(s.runs, s.build, s.issues, s.flakyReviewed);
  const latest = latestResults(s.runs, s.build);
  const untested = CHECKS.filter((c) => !latest.has(c.id));
  const ready = !blockers.length && s.gapsAccepted && s.signoffs.length === 3;
  const spend = s.runs.reduce((n, r) => n + r.cost, 0);
  const flaky = [...latest.values()].find(
    (item) => !item.stale && item.result.outcome === "flaky",
  );
  return (
    <div>
      <p className="qa-eyebrow mb-2">RELEASE REVIEW · BUILD {s.build}</p>
      <h2 className="qa-heading">One last review before release.</h2>
      <p className="mb-8 mt-2 text-sm leading-6 text-muted-foreground">
        Check the evidence, acknowledge the limits, and record a human decision.
      </p>
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_272px] xl:gap-12">
        <div className="min-w-0 space-y-7">
          <section>
            <SectionHeading
              detail={
                blockers.length
                  ? `${blockers.length} to address`
                  : "Checks complete"
              }
            >
              Release requirements
            </SectionHeading>
            {blockers.length ? (
              <ul className="divide-y border-y">
                {blockers.map((blocker) => (
                  <li
                    key={blocker}
                    className="flex items-start gap-3 py-3.5 text-sm leading-6"
                  >
                    <TriangleAlertIcon
                      aria-hidden
                      className="mt-1 size-3.5 shrink-0 text-warn"
                    />
                    <span>{blocker}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 rounded-lg bg-brand-soft/60 p-4 text-sm text-brand">
                <CheckCircle2Icon aria-hidden className="size-4" />
                Agreed checks complete on build {s.build}.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {blockers.some((b) =>
                /release pass|stale|failed|blocked/.test(b),
              ) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    s.setScope("release");
                    s.setTab("plan");
                  }}
                >
                  Review release test plan <ArrowRightIcon />
                </Button>
              )}
              {s.issues.some((issue) => issue.status !== "resolved") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => s.setTab("issues")}
                >
                  View open issue <ArrowRightIcon />
                </Button>
              )}
              {flaky && !s.flakyReviewed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    s.selectResult(flaky.run.id, flaky.result.checkId);
                    s.setTab("results");
                  }}
                >
                  Review flaky check <ArrowRightIcon />
                </Button>
              )}
            </div>
            {latest.size > 0 && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer py-2 text-muted-foreground">
                  Current evidence · {latest.size} of {CHECKS.length} checks
                </summary>
                <div className="mt-2 divide-y">
                  {CHECKS.map((check) => {
                    const item = latest.get(check.id);
                    return (
                      <div
                        key={check.id}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <span>
                          {check.id} · {check.title}
                        </span>
                        <Status
                          status={
                            !item
                              ? "not-tested"
                              : item.stale
                                ? "stale"
                                : item.result.outcome
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </details>
            )}
          </section>
          <section className="border-t pt-5">
            <SectionHeading detail={`${untested.length} not tested`}>
              Coverage limits
            </SectionHeading>
            <p className="text-xs leading-6 text-muted-foreground">
              Desktop Chrome and a mobile viewport only. Real payments,
              production email, other browsers and comprehensive security
              testing are outside the agreed checklist.
            </p>
            {untested.length > 0 && (
              <details className="mt-2 text-xs text-muted-foreground">
                <summary className="cursor-pointer py-2">
                  View untested checks
                </summary>
                <ul className="mt-2 space-y-2">
                  {untested.map((c) => (
                    <li key={c.id}>
                      {c.id} · {c.title}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5">
              <Checkbox
                checked={s.gapsAccepted}
                onCheckedChange={s.acceptGaps}
                className="mt-0.5"
              />
              I reviewed the untested areas and accept these limits for this
              demo release.
            </label>
          </section>
          <section className="border-t pt-5">
            <SectionHeading detail={`${s.signoffs.length} of 3 reviewed`}>
              Reviewer sign-offs
            </SectionHeading>
            <div className="divide-y">
              {[
                {
                  key: "product",
                  name: "Matt Flanagan",
                  role: "Product & design",
                },
                { key: "qa", name: "Abdul", role: "Technical QA" },
                { key: "release", name: "Abdul", role: "Release owner" },
              ].map((person) => (
                <label
                  key={person.key}
                  className={cn(
                    "flex items-center gap-3 py-3.5",
                    blockers.length
                      ? "text-muted-foreground"
                      : "cursor-pointer",
                  )}
                >
                  <Checkbox
                    checked={s.signoffs.includes(person.key)}
                    onCheckedChange={() => s.signoff(person.key)}
                    disabled={blockers.length > 0}
                  />
                  <span className="flex-1 text-sm">
                    {person.name}
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {person.role}
                    </span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {s.signoffs.includes(person.key) ? "Reviewed" : "Pending"}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
              Simulated sign-offs. Reviewers are not authenticated.
            </p>
          </section>
        </div>
        <aside
          aria-label="Release decision"
          className="rounded-xl border bg-muted/20 p-5 xl:sticky xl:top-0"
        >
          <h3 className="mb-5 text-sm font-medium">Release decision</h3>
          <dl className="space-y-3 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Build</dt>
              <dd className="font-mono">forme / b{s.build}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Recorded AI spend</dt>
              <dd className="tabular-nums">{money(spend)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Runs / tokens</dt>
              <dd className="tabular-nums">
                {s.runs.length} /{" "}
                {s.runs.reduce((n, r) => n + r.tokens, 0).toLocaleString()}
              </dd>
            </div>
          </dl>
          <p className="mb-5 mt-3 text-[10px] leading-4 text-muted-foreground">
            Illustrative usage, including failures and retries.
          </p>
          <div className="border-t pt-5">
            <Label htmlFor="release-note" className="text-xs">
              Decision notes
            </Label>
            <Textarea
              id="release-note"
              className="mt-2 min-h-28 bg-background text-base sm:text-xs"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add context, or a reason to hold…"
            />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              disabled={!ready}
              className="qa-primary w-full"
              onClick={() => s.decide("approved", note)}
            >
              <ShieldCheckIcon />
              Approve demo release
            </Button>
            <Button
              variant="outline"
              disabled={!note.trim()}
              onClick={() => s.decide("held", note)}
            >
              Hold release
            </Button>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
            {!ready
              ? "Complete the requirements, accept coverage limits and collect all three sign-offs to approve. Add a note to hold."
              : "Checks and reviews complete. Ready for your decision."}
          </p>
          {s.decision && (
            <div
              role="status"
              className={cn(
                "mt-5 rounded-lg p-3 text-xs leading-5",
                s.decision.kind === "approved"
                  ? "bg-brand-soft"
                  : "bg-warn-soft",
              )}
            >
              <p className="font-medium">
                Build {s.decision.build} ·{" "}
                {s.decision.kind === "approved"
                  ? "Approved for demo release"
                  : "Release held"}
              </p>
              {s.decision.note && <p className="mt-2">{s.decision.note}</p>}
              <p className="mt-2 text-muted-foreground">
                Decision saved locally. No deployment triggered.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Empty({
  title,
  description,
  action,
  onClick,
}: {
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="flex min-h-80 flex-col items-start justify-center">
      <CircleDashedIcon className="mb-5 size-7 text-muted-foreground" />
      <h2 className="text-xl font-medium tracking-tight">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <Button className="mt-5" variant="outline" onClick={onClick}>
        {action}
        <ArrowRightIcon />
      </Button>
    </div>
  );
}
