"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHECKS, latestResults, type Run } from "@/lib/qa/model";
import { useQA } from "@/lib/qa/store";
import { ContactSnapshot } from "./contact-preview";
import { Issues, IssueResolution } from "./qa-issues";
import { QAEmpty, QAInboxButton, QASelect, QAStatus, money } from "./qa-shared";
import { QASplit } from "./qa-split";

export function RunCost({ run }: { run: Run }) {
  const attempts = run.results.flatMap((result) => result.attempts);
  return (
    <Accordion className="border-t" data-tour="qa-usage">
      <AccordionItem value="usage">
        <AccordionTrigger>
          <span>Run usage</span>
          <span className="ml-auto text-xs font-normal tabular-nums text-muted-foreground">
            {money(run.cost)} · {attempts.length} attempts
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-muted-foreground">Recorded AI cost</dt>
                <dd className="mt-1 text-sm font-medium tabular-nums">
                  {money(run.cost)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tokens used</dt>
                <dd className="mt-1 text-sm tabular-nums">
                  {run.tokens.toLocaleString()}
                </dd>
              </div>
            </dl>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 font-normal">AI-assisted check</th>
                  <th className="p-2 text-right font-normal">Attempts</th>
                  <th className="py-2 text-right font-normal">Cost</th>
                </tr>
              </thead>
              <tbody>
                {run.results
                  .filter((result) =>
                    result.attempts.some((a) => a.inputTokens),
                  )
                  .map((result) => (
                    <tr key={result.checkId} className="border-b last:border-0">
                      <td className="py-3 pr-3">
                        {
                          CHECKS.find((check) => check.id === result.checkId)
                            ?.title
                        }
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {result.attempts.length}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {money(result.attempts.reduce((n, a) => n + a.cost, 0))}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <p className="text-xs leading-5 text-muted-foreground">
              Includes failed attempts and retries. Coded checks use no AI
              tokens. Demo rates: $2/M input and $8/M output; these are
              illustrative costs.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function Results({
  running,
  onRun,
}: {
  onRun: () => void;
  running: boolean;
}) {
  const s = useQA();
  const [filter, setFilter] = useState("all");
  const open = s.evidenceOpen || s.tab === "issues";
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) document.getElementById("qa-evidence-title")?.focus();
    else if (wasOpen.current)
      document.getElementById(`evidence-${s.activeCheck}`)?.focus();
    wasOpen.current = open;
  }, [open, s.activeCheck, s.tab]);
  const close = () => {
    s.setTab("results");
  };
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !document.querySelector('[role="dialog"], [role="listbox"]')
      )
        useQA.getState().setTab("results");
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);
  const run = s.runs.find((item) => item.id === s.activeRun) ?? s.runs.at(-1);
  if (!run && !s.issues.length)
    return (
      <QAEmpty
        title="Ready for your first run"
        description="Select your checks and start a run. Review the results here."
        action="Choose checks"
        onAction={() => s.setTab("plan")}
      />
    );
  const retest = () => {
    s.setScope("release");
    onRun();
  };
  const currentRun = s.runs.findLast((item) => item.build === s.build);
  const failure = run?.results.find((result) => result.outcome === "failed");
  const blocked = run?.results.find((result) => result.outcome === "blocked");
  const flaky = run?.results.find((result) => result.outcome === "flaky");
  const isOld = run && run.build !== s.build;
  const nextLabel = isOld
    ? currentRun
      ? "View current results"
      : "Retest fix"
    : failure
      ? "View failed check"
      : blocked
        ? "Resolve setup"
        : flaky && !s.flakyReviewed
          ? "Review retry"
          : "Review release";
  const next = () => {
    if (!run) return;
    if (isOld && currentRun) {
      s.selectResult(currentRun.id, s.activeCheck);
      s.setTab("results");
      setFilter("all");
    } else if (isOld) s.inspectResult(run.id, "C02");
    else if (failure || blocked || (flaky && !s.flakyReviewed))
      s.inspectResult(run.id, (failure ?? blocked ?? flaky)!.checkId);
    else s.setTab("release");
  };
  const list = (
    <div
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      data-tour="qa-results"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 pb-12">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-medium">Test results</h2>
            <p className="text-xs text-muted-foreground">
              {run
                ? `Run ${run.id} · Build ${run.build} · ${run.results.length} checks`
                : "Tester-reported issue"}
            </p>
          </div>
          {s.runs.length > 1 && run && (
            <QASelect
              label="Run history"
              value={String(run.id)}
              items={[...s.runs]
                .reverse()
                .map((item) => ({
                  value: String(item.id),
                  label: `Run ${item.id} · build ${item.build}`,
                }))}
              onChange={(value) => s.selectResult(Number(value), s.activeCheck)}
            />
          )}
        </div>
        {run && (
          <>
            {isOld ? (
              <Alert role="status">
                <AlertTitle>Results from build {run.build}</AlertTitle>
                <AlertDescription>
                  Changed checks are stale. Their original evidence stays in
                  history.
                </AlertDescription>
              </Alert>
            ) : (
              <p className="text-sm text-muted-foreground">
                {failure
                  ? "Review the failed check, apply the fix, then retest."
                  : blocked
                    ? "Connect the test inbox to finish delivery testing."
                    : flaky && !s.flakyReviewed
                      ? "One check passed on retry. Review both attempts."
                      : "Checks reviewed. Continue to the release decision."}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {!open && (
                <Button onClick={next} disabled={running}>
                  {nextLabel}
                  <ArrowRightIcon aria-hidden />
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => s.setTab("plan")}
                disabled={running}
              >
                New run
              </Button>
            </div>
            <div className="min-w-0 overflow-x-auto pb-1">
              <Tabs
                value={filter}
                onValueChange={(value) => setFilter(String(value))}
              >
                <TabsList aria-label="Filter results">
                  {[
                    { value: "all", label: "All" },
                    { value: "failed", label: "Failed" },
                    { value: "blocked", label: "Blocked" },
                    { value: "flaky", label: "Flaky" },
                    { value: "passed", label: "Passed" },
                  ].map((item) => (
                    <TabsTrigger key={item.value} value={item.value}>
                      {item.label}
                      <span className="text-xs tabular-nums">
                        {item.value === "all"
                          ? run.results.length
                          : run.results.filter(
                              (result) => result.outcome === item.value,
                            ).length}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <ul className="flex flex-col divide-y">
              {[...run.results]
                .filter(
                  (result) => filter === "all" || result.outcome === filter,
                )
                .sort(
                  (a, b) =>
                    ["failed", "blocked", "flaky", "passed"].indexOf(
                      a.outcome,
                    ) -
                    ["failed", "blocked", "flaky", "passed"].indexOf(b.outcome),
                )
                .map((result) => {
                  const check = CHECKS.find(
                    (item) => item.id === result.checkId,
                  )!;
                  return (
                    <li
                      key={check.id}
                      className={
                        open && s.activeCheck === check.id
                          ? "rounded-xl bg-muted/60"
                          : ""
                      }
                    >
                      <button
                        id={`evidence-${check.id}`}
                        aria-label={`View evidence for ${check.title}`}
                        aria-current={
                          open && s.activeCheck === check.id
                            ? "true"
                            : undefined
                        }
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-4 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
                        onClick={() => s.inspectResult(run.id, check.id)}
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-2">
                          <span className="text-sm leading-5">
                            {check.title}
                          </span>
                          <span className="flex flex-wrap items-center gap-2">
                            <QAStatus
                              status={
                                run.build !== s.build && check.affected
                                  ? "stale"
                                  : result.outcome
                              }
                            />
                            <span className="text-xs text-muted-foreground">
                              {result.attempts.length
                                ? `${result.attempts.length} attempt${result.attempts.length === 1 ? "" : "s"}`
                                : "Not executed"}
                            </span>
                          </span>
                        </span>
                        <ChevronRightIcon
                          aria-hidden
                          className="size-4 shrink-0 text-muted-foreground"
                        />
                      </button>
                    </li>
                  );
                })}
            </ul>
            {!run.results.some(
              (result) => filter === "all" || result.outcome === filter,
            ) && (
              <p className="py-6 text-sm text-muted-foreground">
                No {filter} checks in this run. Select All to see every result.
              </p>
            )}
            <RunCost run={run} />
          </>
        )}
        {!run && s.issues.length > 0 && (
          <Button className="w-fit" onClick={() => s.setTab("issues")}>
            Review reported issue
            <ArrowRightIcon aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
  const selected =
    run?.results.find((result) => result.checkId === s.activeCheck) ??
    run?.results[0];
  const detail = (
    <aside
      aria-label="Result details"
      className="@container/qa-detail flex min-h-0 flex-1 flex-col"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-6 py-3">
        <Button variant="ghost" size="sm" onClick={close}>
          <ArrowLeftIcon aria-hidden />
          All results
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close result details"
          onClick={close}
        >
          <XIcon aria-hidden />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-6">
          {s.tab === "issues" || !run || !selected ? (
            <Issues onRetest={retest} />
          ) : (
            <Evidence run={run} resultId={selected.checkId} onRetest={retest} />
          )}
        </div>
      </div>
    </aside>
  );
  return <QASplit open={open} list={list} detail={detail} />;
}

function Evidence({
  run,
  resultId,
  onRetest,
}: {
  run: Run;
  resultId: string;
  onRetest: () => void;
}) {
  const s = useQA();
  const selected = run.results.find((result) => result.checkId === resultId)!;
  const check = CHECKS.find((item) => item.id === resultId)!;
  const stale = run.build !== s.build && check.affected;
  const current =
    !stale && latestResults(s.runs, s.build).get(check.id)?.run.id === run.id;
  return (
    <section
      aria-label="Check evidence"
      className="flex flex-col gap-6"
      data-tour="qa-evidence"
    >
      <div className="flex flex-col gap-2">
        <div>
          <QAStatus status={stale ? "stale" : selected.outcome} />
        </div>
        <h2
          id="qa-evidence-title"
          tabIndex={-1}
          className="text-lg font-medium outline-none"
        >
          {check.title}
        </h2>
        <p className="text-xs text-muted-foreground">
          Run {run.id} · Build {run.build} · {check.runner}
        </p>
      </div>
      <dl
        data-tour="qa-comparison"
        className="grid gap-5 text-sm leading-6 @lg/qa-detail:grid-cols-2"
      >
        <div>
          <dt className="mb-2 font-medium">Expected</dt>
          <dd>{check.expected}</dd>
        </div>
        <div>
          <dt className="mb-2 font-medium">Actual</dt>
          <dd>{selected.actual}</dd>
        </div>
      </dl>
      {check.id === "C02" && s.issues.length > 0 && (
        <IssueResolution onRetest={onRetest} />
      )}
      {check.id === "C02" && (
        <Accordion defaultValue={["capture"]}>
          <AccordionItem value="capture">
            <AccordionTrigger>
              {run.build === 12 ? "Captured comparison" : "Verified capture"}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 @2xl/qa-detail:grid-cols-2">
                {run.build === 12 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">Expected</p>
                    <ContactSnapshot build={13} expected />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">
                    Actual · Build {run.build}
                  </p>
                  <ContactSnapshot
                    build={run.build}
                    annotation={run.build === 12}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      <section
        data-tour="qa-debug"
        className="flex flex-col gap-4 border-t pt-5"
      >
        <h3 className="text-sm font-medium">Steps and environment</h3>
        <p className="text-sm leading-6">{check.steps}</p>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-xs @lg/qa-detail:grid-cols-4">
          {[
            ["Environment", "Staging"],
            ["Browser", "Chrome"],
            ["Role", "Guest shopper"],
            [
              "Viewport",
              check.device === "Mobile" ? "390 × 844" : "1440 × 900",
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="mt-1">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted-foreground">
          Demo execution · {new Date(run.created).toLocaleString()}
        </p>
      </section>
      <Accordion
        defaultValue={selected.outcome === "flaky" ? ["attempts"] : []}
      >
        <AccordionItem value="attempts">
          <AccordionTrigger>
            Debugging and attempts
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {selected.attempts.length} recorded
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-5">
              {selected.attempts.length ? (
                selected.attempts.map((attempt, index) => (
                  <section key={index} className="flex flex-col gap-2">
                    <div className="flex flex-wrap justify-between gap-2 text-xs">
                      <h4 className="font-medium">
                        {index ? `Retry ${index}` : "Attempt 1"} ·{" "}
                        {attempt.outcome}
                      </h4>
                      <span className="tabular-nums text-muted-foreground">
                        {attempt.duration} · {money(attempt.cost)}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap break-words rounded-lg bg-muted p-4 text-xs leading-6">
                      {attempt.log}
                    </pre>
                    <p className="text-xs text-muted-foreground">
                      {attempt.inputTokens.toLocaleString()} input ·{" "}
                      {attempt.outputTokens.toLocaleString()} output tokens
                    </p>
                  </section>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No attempt recorded. Connect the test inbox, then rerun this
                  check.
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {selected.outcome === "flaky" && (
        <div data-tour="qa-retry" className="flex flex-col items-start gap-4">
          <label className="flex items-start gap-3 text-sm leading-6">
            <Checkbox
              className="mt-1"
              checked={current && s.flakyReviewed}
              disabled={!current}
              onCheckedChange={(value) => {
                s.reviewFlaky(value);
                if (value) toast.success("Retry reviewed");
              }}
            />
            {current
              ? "I reviewed both attempts and accept response timing as a known limitation."
              : "Review the latest run on the current build to accept this limitation."}
          </label>
          {current && s.flakyReviewed && (
            <Button onClick={() => s.setTab("release")}>
              Review release
              <ArrowRightIcon aria-hidden />
            </Button>
          )}
        </div>
      )}
      {selected.outcome === "blocked" && (
        <div className="flex flex-col items-start gap-3">
          <QAInboxButton />
          {s.inbox && (
            <Button
              onClick={() => {
                s.setScope(run.scope);
                onRetest();
              }}
            >
              Rerun release checks
              <ArrowRightIcon aria-hidden />
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
