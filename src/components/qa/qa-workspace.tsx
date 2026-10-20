"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronRightIcon,
  CircleDashedIcon,
  ExternalLinkIcon,
  FlaskConicalIcon,
  GitBranchIcon,
  Loader2Icon,
  MessageSquareIcon,
  PlayIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TriangleAlertIcon,
  XCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CHECKS,
  SCOPES,
  estimatedCost,
  latestResults,
  releaseBlockers,
  type Outcome,
  type QATab,
  type Run,
} from "@/lib/qa/model";
import { useQA } from "@/lib/qa/store";
import { cn } from "@/lib/utils";
import { ContactPreview, ContactSnapshot } from "./contact-preview";

const money = (value: number) => `$${value.toFixed(2)}`;
const TITLES: Record<QATab, string> = {
  plan: "Run plan",
  results: "Results",
  issues: "Issues & retest",
  release: "Release review",
};
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

function RunPlan({ running, onRun }: { running: boolean; onRun: () => void }) {
  const s = useQA();
  const omitted = CHECKS.filter((c) => !s.selected.includes(c.id));
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-medium tracking-tight">
          A focused check before we ship.
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          The contact form’s submission handling changed. Check recovery and
          delivery, and make sure the buying journey still works.
        </p>
      </div>
      <section>
        <SectionHeading>Choose the coverage</SectionHeading>
        <div className="grid gap-2 sm:grid-cols-3">
          {SCOPES.map((scope) => (
            <button
              key={scope.id}
              type="button"
              aria-pressed={s.scope === scope.id}
              onClick={() => s.setScope(scope.id)}
              className={cn(
                "rounded-xl border p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                s.scope === scope.id
                  ? "border-brand/50 bg-brand-soft/50"
                  : "hover:bg-muted/50",
              )}
            >
              <div className="flex items-center justify-between gap-2 text-sm font-medium">
                {scope.title}
                {s.scope === scope.id && (
                  <CheckIcon className="size-3.5 text-brand" />
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {scope.description}
              </p>
              <p className="mt-3 text-xs tabular-nums">{scope.estimate}</p>
            </button>
          ))}
        </div>
      </section>
      <section>
        <SectionHeading
          detail={`${s.selected.length} of ${CHECKS.length} agreed checks selected`}
        >
          Checks to run
        </SectionHeading>
        <div className="divide-y rounded-xl border px-4">
          {CHECKS.filter(
            (c) =>
              s.selected.includes(c.id) ||
              s.scope === "release" ||
              c.scope === "changed" ||
              (s.scope === "risk" && c.scope === "risk"),
          ).map((check) => (
            <label
              key={check.id}
              className="flex cursor-pointer items-start gap-3 py-3.5"
            >
              <Checkbox
                checked={s.selected.includes(check.id)}
                onCheckedChange={() => s.toggleCheck(check.id)}
                className="mt-0.5"
                aria-label={`Include ${check.title}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm">{check.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {check.id} · {check.area} · {check.device}
                </p>
              </div>
              <span className="mt-0.5 shrink-0 text-xs text-muted-foreground">
                {check.runner}
              </span>
            </label>
          ))}
        </div>
      </section>
      <section>
        <SectionHeading>Ready to run?</SectionHeading>
        <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Target</dt>
            <dd className="mt-1">Build {s.build} · Staging</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Roles & accounts</dt>
            <dd className="mt-1">Guest shopper · demo inbox</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Devices</dt>
            <dd className="mt-1">
              {s.selected.some(
                (id) => CHECKS.find((c) => c.id === id)?.device === "Mobile",
              )
                ? "Desktop Chrome + mobile viewport"
                : "Desktop Chrome"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              Estimated AI spend
            </dt>
            <dd className="mt-1 tabular-nums">
              {money(estimatedCost(s.selected))} · includes retry allowance
            </dd>
          </div>
        </dl>
        {s.selected.includes("C03") && !s.inbox ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warn-soft p-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <TriangleAlertIcon className="size-4 text-warn" />
                Inbox delivery is blocked
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                No test inbox configured. Other checks can run.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={s.configureInbox}>
              Set up demo inbox
            </Button>
          </div>
        ) : (
          s.inbox && (
            <p className="mt-4 flex items-center gap-2 text-xs text-brand">
              <CheckCircle2Icon className="size-3.5" />
              Demo inbox configured
            </p>
          )
        )}
      </section>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">
          {omitted.length} checks outside this run · coverage limitations
        </summary>
        <ul className="mt-3 space-y-2">
          {omitted.map((c) => (
            <li key={c.id}>
              {c.id} · {c.title}
            </li>
          ))}
        </ul>
        <p className="mt-3">
          The agreed demo checklist excludes real payments, production delivery,
          comprehensive security testing and additional browsers. Passing this
          run does not verify the entire site.
        </p>
      </details>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <p className="text-xs text-muted-foreground">
          Simulated run · no external services
        </p>
        <Button onClick={onRun} disabled={running || !s.selected.length}>
          {running ? (
            <Loader2Icon className="motion-safe:animate-spin" />
          ) : (
            <PlayIcon />
          )}
          {running ? "Running checks…" : `Run ${s.selected.length} checks`}
        </Button>
      </div>
    </div>
  );
}

function Results({ onRun, running }: { onRun: () => void; running: boolean }) {
  const s = useQA();
  const run = s.runs.find((r) => r.id === s.activeRun) ?? s.runs.at(-1);
  if (!run)
    return (
      <Empty
        title="The evidence starts here."
        description="Review the plan and run your first checks. Results will be tied to that build."
        action="Review run plan"
        onClick={() => s.setTab("plan")}
      />
    );
  const selected =
    run.results.find((r) => r.checkId === s.activeCheck) ?? run.results[0];
  const check = CHECKS.find((c) => c.id === selected.checkId)!;
  const stale = run.build !== s.build && check.affected;
  const counts = (status: Outcome) =>
    run.results.filter((r) => r.outcome === status).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium tracking-tight">
            {counts("failed") || counts("blocked")
              ? "A few things need attention."
              : "Checks complete. Evidence ready."}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Run {run.id} · Build {run.build} · {run.selected.length} checks
            selected
          </p>
        </div>
        <label className="text-xs text-muted-foreground">
          Run history
          <select
            aria-label="Run history"
            value={run.id}
            onChange={(e) =>
              s.selectResult(Number(e.target.value), s.activeCheck)
            }
            className="ml-2 rounded-md border bg-background p-2 text-foreground"
          >
            {[...s.runs].reverse().map((r) => (
              <option key={r.id} value={r.id}>
                Run {r.id} · b{r.build}
              </option>
            ))}
          </select>
        </label>
      </div>
      {run.build !== s.build && (
        <div className="rounded-lg bg-warn-soft p-3 text-sm">
          You’re viewing build {run.build}. Contact-form evidence needs
          retesting on build {s.build}; these original results are preserved.
        </div>
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-y py-3">
        {(["passed", "failed", "blocked", "flaky"] as Outcome[]).map(
          (status) => (
            <span key={status} className="flex items-center gap-2">
              <span className="text-sm tabular-nums">{counts(status)}</span>
              <Status status={status} />
            </span>
          ),
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="pb-3 font-normal">Check</th>
              <th className="pb-3 font-normal">Runner</th>
              <th className="pb-3 font-normal">Result</th>
              <th className="pb-3 font-normal">
                <span className="sr-only">Open evidence</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {run.results.map((result) => {
              const c = CHECKS.find((c) => c.id === result.checkId)!;
              return (
                <tr
                  key={c.id}
                  className={cn(
                    "group",
                    c.id === selected.checkId && "bg-muted/50",
                  )}
                >
                  <td className="py-3 pr-3">
                    <button
                      className="rounded-sm text-left outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => s.selectResult(run.id, c.id)}
                    >
                      <span className="mr-2 text-xs text-muted-foreground">
                        {c.id}
                      </span>
                      {c.title}
                    </button>
                  </td>
                  <td className="pr-3 text-xs text-muted-foreground">
                    {c.runner}
                  </td>
                  <td>
                    <Status
                      status={
                        run.build !== s.build && c.affected
                          ? "stale"
                          : result.outcome
                      }
                    />
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`View evidence for ${c.title}`}
                      onClick={() => s.selectResult(run.id, c.id)}
                    >
                      <ChevronRightIcon />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <section className="rounded-xl border p-5">
        <SectionHeading detail={`Build ${run.build}`}>
          {check.id} · {check.title}
        </SectionHeading>
        <div className="mb-4">
          <Status status={stale ? "stale" : selected.outcome} />
        </div>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="mb-1 text-xs font-medium text-muted-foreground">
              Steps
            </dt>
            <dd>{check.steps}</dd>
          </div>
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
        {check.id === "C02" && selected.outcome !== "blocked" && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                {run.build === 12 ? "Observed · b12" : "Original failure · b12"}
              </p>
              <ContactSnapshot build={12} annotation />
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                {run.build === 12
                  ? "Expected · message retained"
                  : "Verified fix · b13"}
              </p>
              <ContactSnapshot build={13} expected={run.build === 12} />
            </div>
          </div>
        )}
        <div className="mt-5 space-y-2">
          {selected.attempts.map((attempt, i) => (
            <details key={i} className="rounded-md bg-muted/50 p-3 text-xs">
              <summary className="cursor-pointer">
                {i ? `Retry ${i}` : "Attempt 1"} · {attempt.outcome} ·{" "}
                {attempt.duration} · {money(attempt.cost)}
              </summary>
              <pre className="mt-3 whitespace-pre-wrap break-words font-mono leading-relaxed">
                {attempt.log}
              </pre>
              <p className="mt-3 text-muted-foreground">
                Input: {attempt.inputTokens.toLocaleString()} tokens · Output:{" "}
                {attempt.outputTokens.toLocaleString()} tokens
              </p>
            </details>
          ))}
        </div>
        {selected.outcome === "blocked" && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={s.configureInbox}
              disabled={s.inbox}
            >
              {s.inbox ? "Demo inbox ready" : "Set up demo inbox"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => s.setTab("plan")}>
              Review plan & rerun
              <ArrowRightIcon />
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
            Open QA-104
            <ArrowRightIcon />
          </Button>
        )}
        {selected.outcome === "flaky" && (
          <label className="mt-4 flex items-start gap-3 text-sm">
            <Checkbox
              className="mt-0.5"
              checked={s.flakyReviewed}
              onCheckedChange={s.reviewFlaky}
            />
            I reviewed both attempts. Track response timing as a known
            limitation.
          </label>
        )}
      </section>
      <RunCost run={run} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <span className="text-xs text-muted-foreground">
          {CHECKS.length - run.selected.length} agreed checks outside this run
        </span>
        <Button variant="outline" onClick={() => s.setTab("release")}>
          Review release
          <ArrowRightIcon />
        </Button>
      </div>
      {running && (
        <p role="status" className="text-sm text-muted-foreground">
          Running checks…
        </p>
      )}
      {s.build !== run.build && (
        <Button onClick={onRun} disabled={running}>
          Retest current selection on build {s.build}
        </Button>
      )}
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

function Issues({ openPreview }: { openPreview: () => void }) {
  const s = useQA();
  const issue = s.issues[0];
  if (!issue)
    return (
      <Empty
        title="No issues yet."
        description="Run the checks or reproduce the failed submission in the storefront and capture feedback."
        action="Open storefront"
        onClick={openPreview}
      />
    );
  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-xs text-muted-foreground">
            Cockpit tracker · {issue.id}
          </p>
          <h2 className="max-w-lg text-xl font-medium tracking-tight">
            {issue.title}
          </h2>
        </div>
        <span
          className={cn(
            "rounded-full bg-muted px-3 py-1 text-xs",
            issue.status === "resolved" && "bg-brand-soft text-brand",
          )}
        >
          {issue.status === "fixed"
            ? "Needs retest"
            : issue.status === "in-progress"
              ? "In progress"
              : issue.status === "resolved"
                ? "Resolved"
                : "Open"}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        When a request fails, the form resets before the customer can retry.
        Keep the message until the request succeeds.
      </p>
      <section>
        <SectionHeading>Evidence stays with the issue</SectionHeading>
        <div className="border-l-2 border-border pl-5">
          <p className="text-sm">
            Original report · Build {issue.originalBuild}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            C02 · Expected: message retained. Actual: message cleared.
          </p>
          <div className="mt-4 max-w-sm">
            <ContactSnapshot build={issue.originalBuild} annotation />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => {
              const run = s.runs.find((r) =>
                r.results.some((r) => r.checkId === "C02"),
              );
              if (run) s.selectResult(run.id, "C02");
              s.setTab("results");
            }}
          >
            View test evidence
            <ArrowRightIcon />
          </Button>
        </div>
      </section>
      <section>
        <SectionHeading
          detail={`${s.feedback.length} report${s.feedback.length === 1 ? "" : "s"}`}
        >
          Human feedback
        </SectionHeading>
        {s.feedback.length ? (
          <div className="space-y-4">
            {s.feedback.map((f) => (
              <details key={f.id} className="rounded-lg border p-4">
                <summary className="cursor-pointer text-sm">
                  {f.id} · {f.category} · Build {f.build}
                </summary>
                <p className="mt-3 text-sm">{f.description}</p>
                <dl className="mt-3 space-y-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Expected</dt>
                    <dd>{f.expected}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Actual</dt>
                    <dd>{f.actual}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  {f.page} · {f.device} · Original capture retained
                </p>
                <div className="mt-4 max-w-xs">
                  <ContactSnapshot build={f.build} annotation={f.annotation} />
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Reproduce the issue and attach a tester’s report.
            </p>
            <Button variant="outline" size="sm" onClick={openPreview}>
              Open storefront
              <ExternalLinkIcon />
            </Button>
          </div>
        )}
      </section>
      <section>
        <SectionHeading>Fix → new build → retest</SectionHeading>
        <ol className="space-y-4 border-l pl-5 text-sm">
          <li>
            <span className="font-medium">Build 12 · failure captured</span>
            <p className="mt-1 text-xs text-muted-foreground">
              Original screenshots, logs and feedback stay attached.
            </p>
          </li>
          {issue.status !== "open" && (
            <li>
              <span className="font-medium">Fix in progress</span>
              <p className="mt-1 text-xs text-muted-foreground">
                Move form.reset() into the successful response handler.
              </p>
            </li>
          )}
          {issue.fixedBuild && (
            <li>
              <span className="font-medium">
                Build {issue.fixedBuild} · fix prepared
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                Contact-form evidence marked stale. The fix needs verification.
              </p>
            </li>
          )}
          {issue.status === "resolved" && (
            <li className="text-brand">
              Build 13 · retest passed · issue resolved
            </li>
          )}
        </ol>
        {issue.status === "open" && (
          <Button className="mt-5" onClick={s.startFix}>
            <GitBranchIcon />
            Prepare a fix
          </Button>
        )}
        {issue.status === "in-progress" && (
          <div className="mt-5 space-y-4">
            <pre className="overflow-x-auto rounded-lg bg-muted/50 p-4 text-xs leading-relaxed">
              <code>
                {
                  "- form.reset();\n  const response = await sendMessage(values);\n+ if (response.ok) form.reset();"
                }
              </code>
            </pre>
            <Button onClick={s.fix}>
              Apply demo fix · build 13
              <ArrowRightIcon />
            </Button>
          </div>
        )}
        {issue.status === "fixed" && (
          <div className="mt-5 rounded-lg bg-warn-soft p-4">
            <p className="text-sm">
              Fixed is not verified. Run the release checks against build 13.
            </p>
            <Button
              className="mt-3"
              size="sm"
              onClick={() => {
                s.setScope("release");
                s.setTab("plan");
              }}
            >
              Prepare release retest
              <ArrowRightIcon />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function ReleaseReview() {
  const s = useQA();
  const [note, setNote] = useState("");
  const blockers = releaseBlockers(s.runs, s.build, s.issues, s.flakyReviewed);
  const latest = latestResults(s.runs, s.build);
  const untested = CHECKS.filter((c) => !latest.has(c.id));
  const ready = !blockers.length && s.gapsAccepted && s.signoffs.length === 3;
  const spend = s.runs.reduce((n, r) => n + r.cost, 0);
  return (
    <div className="space-y-7">
      <div>
        <p className="mb-2 text-xs text-muted-foreground">
          Forme ecommerce · Build {s.build}
        </p>
        <h2 className="text-xl font-medium tracking-tight">
          A decision, backed by evidence.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Review what we know, acknowledge what we haven’t checked, and record
          the release decision.
        </p>
      </div>
      <section>
        <SectionHeading>Release readiness</SectionHeading>
        {blockers.length ? (
          <ul className="space-y-3 rounded-xl bg-warn-soft p-4">
            {blockers.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warn" />
                {b}
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 rounded-xl bg-brand-soft p-4 text-sm text-brand">
            <CheckCircle2Icon className="size-4" />
            Agreed checks complete. Ready for human review.
          </p>
        )}
        <div className="mt-4 divide-y">
          {[...latest.entries()]
            .filter(
              ([, item]) => item.stale || item.result.outcome !== "passed",
            )
            .map(([id, item]) => (
              <button
                key={id}
                className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  s.selectResult(item.run.id, id);
                  s.setTab("results");
                }}
              >
                <span>
                  {id} · {CHECKS.find((c) => c.id === id)?.title}
                </span>
                <Status status={item.stale ? "stale" : item.result.outcome} />
              </button>
            ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              s.setScope("release");
              s.setTab("plan");
            }}
          >
            Prepare full release pass
          </Button>
          {!s.flakyReviewed && s.runs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const r = s.runs.at(-1)!;
                s.selectResult(r.id, "C04");
                s.setTab("results");
              }}
            >
              Review flaky check
              <ArrowRightIcon />
            </Button>
          )}
        </div>
      </section>
      <section>
        <SectionHeading detail={`${untested.length} agreed checks not tested`}>
          Coverage & limitations
        </SectionHeading>
        {untested.length > 0 && (
          <p className="mb-3 text-xs text-muted-foreground">
            Not tested: {untested.map((c) => `${c.id} ${c.title}`).join("; ")}.
          </p>
        )}
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          This demo covers desktop Chrome and a mobile viewport. Real payments,
          production email, other browsers and comprehensive security testing
          are outside the agreed checklist.
        </p>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox
            checked={s.gapsAccepted}
            onCheckedChange={s.acceptGaps}
            className="mt-0.5"
          />
          I reviewed the untested areas and accept these limits for this demo
          release.
        </label>
      </section>
      <section>
        <SectionHeading detail="Demo reviewer sign-offs">
          Named reviewers
        </SectionHeading>
        <div className="divide-y">
          {[
            { key: "product", name: "Matt Flanagan", role: "Product & design" },
            { key: "qa", name: "Abdul", role: "Technical QA" },
            { key: "release", name: "Abdul", role: "Release owner" },
          ].map((person) => (
            <label
              key={person.key}
              className="flex cursor-pointer items-center gap-3 py-3"
            >
              <Checkbox
                checked={s.signoffs.includes(person.key)}
                onCheckedChange={() => s.signoff(person.key)}
                disabled={blockers.length > 0}
              />
              <span className="flex-1 text-sm">
                {person.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  {person.role}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {s.signoffs.includes(person.key) ? "Reviewed" : "Pending"}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          These controls simulate sign-off; they don’t authenticate reviewers.
        </p>
      </section>
      <section>
        <SectionHeading>Project AI spend</SectionHeading>
        <div className="flex flex-wrap gap-x-10 gap-y-3 border-y py-4">
          <div>
            <p className="text-xs text-muted-foreground">
              Recorded across {s.runs.length} runs
            </p>
            <p className="mt-1 text-lg font-medium tabular-nums">
              {money(spend)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Total tokens · all attempts
            </p>
            <p className="mt-1 text-lg font-medium tabular-nums">
              {s.runs.reduce((n, r) => n + r.tokens, 0).toLocaleString()}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Illustrative local usage includes failed attempts and retries.
        </p>
      </section>
      <section>
        <Label htmlFor="release-note">Decision notes</Label>
        <Textarea
          id="release-note"
          className="mt-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for holding, or context for approval…"
        />
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            disabled={!note.trim()}
            onClick={() => s.decide("held", note)}
          >
            Hold release
          </Button>
          <Button disabled={!ready} onClick={() => s.decide("approved", note)}>
            <ShieldCheckIcon />
            Approve demo release
          </Button>
        </div>
        {!ready && (
          <p className="mt-3 text-xs text-muted-foreground">
            Approval requires the current-build release pass, no unresolved
            blockers, review of flakiness and coverage limits, and all three
            sign-offs.
          </p>
        )}
      </section>
      {s.decision && (
        <div
          role="status"
          className={cn(
            "rounded-xl p-5",
            s.decision.kind === "approved" ? "bg-brand-soft" : "bg-warn-soft",
          )}
        >
          <p className="font-medium">
            Build {s.decision.build} ·{" "}
            {s.decision.kind === "approved"
              ? "Approved for demo release"
              : "Release held"}
          </p>
          <p className="mt-2 text-sm">
            {s.decision.note ||
              "Agreed checks and reviewer sign-offs recorded."}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Local decision only. No deployment was triggered.
          </p>
        </div>
      )}
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

function QAChat({
  onNavigate,
  initialPrompt,
}: {
  onNavigate: () => void;
  initialPrompt?: string;
}) {
  const s = useQA();
  const [input, setInput] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [s.messages.length]);
  const ask = (text: string) => {
    s.addMessage("user", text);
    let reply =
      "I can help with coverage, results, the fix and release readiness. Choose a step in the prepared work to review its evidence.";
    if (/cost|spend|token|usage/i.test(text))
      reply = `The selected plan has an estimated AI cost of ${money(estimatedCost(s.selected))}. Recorded spend across ${s.runs.length} demo runs is ${money(s.runs.reduce((n, r) => n + r.cost, 0))}, including failures and retries. Open a run’s usage detail for each attempt. All usage is simulated.`;
    else if (/why|coverage|scope|plan/i.test(text)) {
      s.setTab("plan");
      reply =
        "I selected the changed contact form and a critical checkout smoke test. Broader coverage adds validation, accessibility and mobile. The release pass runs all 11 agreed checks. You can edit the selection before running.";
    } else if (/fix|issue|feedback/i.test(text)) {
      s.setTab("issues");
      reply = s.issues.length
        ? "QA-104 links the failed check and tester feedback. Prepare the fix there, then apply it to build 13. Original evidence stays attached; a passing retest is required to resolve it."
        : "No issues have been recorded yet. Run the plan or reproduce the problem in the storefront and report it.";
    } else if (/release|approve|ship/i.test(text)) {
      s.setTab("release");
      reply =
        "The release review brings together blockers, coverage gaps, costs and named reviewers. Approval stays with a person. Complete the agreed pass on the current build and review any flakiness before signing off.";
    } else if (/run|retest|test|check/i.test(text)) {
      s.setTab("plan");
      reply = `The plan is ready for build ${s.build}. Review the selected checks and estimate, then press Run checks. ${s.inbox ? "The demo inbox is configured." : "Delivery is blocked until a demo inbox is configured; the other checks can run."}`;
    } else if (/result|fail|evidence/i.test(text)) {
      s.setTab("results");
      reply =
        "The results preserve expected versus actual behavior, screenshots and every attempt. A retry passing doesn’t erase the initial failure.";
    }
    s.addMessage("assistant", reply);
    setInput("");
    onNavigate();
  };
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="edge-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
        <div className="ml-5 rounded-2xl rounded-br-md bg-muted px-4 py-3 text-sm leading-relaxed">
          {initialPrompt ||
            "Check the contact form changes before we ship the ecommerce site."}
        </div>
        <div className="mt-7">
          <span className="mb-3 flex items-center gap-2 text-xs font-medium">
            <SparklesIcon className="size-3.5 text-brand" />
            Cockpit
          </span>
          <p className="text-sm leading-relaxed">
            I’ve prepared a focused QA plan for{" "}
            <span className="font-medium">Forme</span>. We’ll check the contact
            form and a critical checkout journey.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {s.inbox
              ? "The demo inbox is configured. Delivery can now be verified alongside the other checks."
              : "One setup item needs attention: inbox delivery. The remaining checks can run while that’s blocked."}
          </p>
        </div>
        <button
          onClick={() => {
            s.setTab("plan");
            onNavigate();
          }}
          className="mt-5 flex w-full items-center gap-3 rounded-xl border p-4 text-left outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FlaskConicalIcon className="size-5 text-brand" />
          <span className="flex-1">
            <span className="block text-sm font-medium">
              Contact form · QA plan
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Build {s.build} · {s.selected.length} checks ·{" "}
              {money(estimatedCost(s.selected))} est.
            </span>
          </span>
          <ChevronRightIcon className="size-4 text-muted-foreground" />
        </button>
        {s.runs.length > 0 && (
          <div className="mt-6 border-l-2 border-brand/30 pl-4 text-sm leading-relaxed">
            <p>Run {s.runs.at(-1)!.id} is ready to review.</p>
            <p className="mt-1 text-muted-foreground">
              {s.issues[0]?.status === "resolved"
                ? "The message-retention fix passed its retest. Review the flaky response timing before sign-off."
                : s.build === 13
                  ? "Build 13 includes the fix. Retest the affected evidence before resolving the issue."
                  : "The form clears the message on failure. I’ve linked the evidence to QA-104."}
            </p>
          </div>
        )}
        {s.messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "mt-6 text-sm leading-relaxed",
              m.role === "user"
                ? "ml-5 rounded-2xl rounded-br-md bg-muted px-4 py-3"
                : "",
            )}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {["Why these checks?", "What will it cost?"].map((text) => (
            <button
              key={text}
              onClick={() => ask(text)}
              className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              {text}
            </button>
          ))}
        </div>
        <form
          className="rounded-2xl border bg-background p-3 shadow-xs"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) ask(input.trim());
          }}
        >
          <label className="sr-only" htmlFor="qa-chat">
            Message Cockpit about QA
          </label>
          <textarea
            id="qa-chat"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                if (input.trim()) ask(input.trim());
              }
            }}
            placeholder="Ask about the checks…"
            className="w-full resize-none bg-transparent text-sm outline-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Local demo conversation
            </span>
            <Button
              type="submit"
              size="icon-sm"
              disabled={!input.trim()}
              aria-label="Send QA message"
            >
              <ArrowUpIcon />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function QAWorkspace({ initialPrompt }: { initialPrompt?: string }) {
  const s = useQA();
  const [preview, setPreview] = useState(false);
  const [running, setRunning] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [mobileView, setMobileView] = useState<"chat" | "work">("work");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    void useQA.persist.rehydrate();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  const onRun = () => {
    if (running) return;
    const { build, scope, selected, inbox } = useQA.getState();
    const plan = { build, scope, selected: [...selected], inbox };
    setRunning(true);
    timer.current = setTimeout(() => {
      useQA.getState().run(plan);
      setRunning(false);
    }, 1100);
  };
  const navigate = () => setMobileView("work");
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/tasks"
            aria-label="Back to tasks"
            className="rounded-md p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <span className="text-sm text-muted-foreground">Forme</span>
          <ChevronRightIcon className="size-3 text-muted-foreground" />
          <h1 className="truncate text-sm font-medium">Contact form QA</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Restart QA demo"
            disabled={running}
            onClick={() => setConfirmReset(true)}
          >
            <RotateCcwIcon />
          </Button>
          <span className="hidden rounded-md bg-muted px-2 py-1 font-mono text-[11px] sm:inline">
            b{s.build} · staging
          </span>
          <Button size="sm" variant="outline" onClick={() => setPreview(true)}>
            Open storefront
            <ExternalLinkIcon />
          </Button>
        </div>
      </header>
      <div className="flex items-center justify-between border-b px-4 py-2 lg:hidden">
        <Button
          variant={mobileView === "chat" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMobileView("chat")}
        >
          <MessageSquareIcon />
          Chat
        </Button>
        <Button
          variant={mobileView === "work" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMobileView("work")}
        >
          <FlaskConicalIcon />
          Prepared work
        </Button>
      </div>
      <div className="flex min-h-0 flex-1">
        <aside
          aria-label="QA conversation"
          className={cn(
            "min-h-0 w-full shrink-0 border-r lg:block lg:w-[32%] lg:max-w-md",
            mobileView !== "chat" && "hidden",
          )}
        >
          <QAChat initialPrompt={initialPrompt} onNavigate={navigate} />
        </aside>
        <section
          aria-label="QA prepared work"
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col",
            mobileView !== "work" && "hidden lg:flex",
          )}
        >
          <div className="shrink-0 overflow-x-auto border-b px-4 pt-3 sm:px-8">
            <Tabs
              value={s.tab}
              onValueChange={(value) => s.setTab(value as QATab)}
            >
              <TabsList
                variant="line"
                aria-label="QA workflow"
                className="h-11 gap-3"
              >
                {(Object.keys(TITLES) as QATab[]).map((tab, i) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="gap-2 px-1 text-xs sm:text-sm"
                  >
                    <span
                      className={cn(
                        "grid size-5 place-items-center rounded-full text-[10px]",
                        s.tab === tab
                          ? "bg-brand-soft text-brand"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    {TITLES[tab]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div
            className="edge-scroll min-h-0 flex-1 overflow-y-auto"
            aria-busy={running}
          >
            <div className="mx-auto w-full max-w-4xl px-5 py-7 sm:px-8 sm:py-9">
              {running && (
                <div
                  role="status"
                  className="mb-6 flex items-center gap-3 rounded-lg bg-brand-soft p-4 text-sm"
                >
                  <Loader2Icon className="size-4 text-brand motion-safe:animate-spin" />
                  Running the demo checks against build {s.build}…
                </div>
              )}
              {s.tab === "plan" ? (
                <RunPlan running={running} onRun={onRun} />
              ) : s.tab === "results" ? (
                <Results running={running} onRun={onRun} />
              ) : s.tab === "issues" ? (
                <Issues openPreview={() => setPreview(true)} />
              ) : (
                <ReleaseReview />
              )}
            </div>
          </div>
        </section>
      </div>
      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restart the QA demo?</DialogTitle>
            <DialogDescription>
              This clears the local QA runs, feedback and decisions and returns
              to build 12. Your other Cockpit work stays in place.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                s.reset();
                setConfirmReset(false);
              }}
            >
              Restart demo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ContactPreview
        key={`${preview}-${s.build}`}
        open={preview}
        onOpenChange={setPreview}
      />
    </div>
  );
}
