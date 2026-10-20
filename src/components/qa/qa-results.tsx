"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  HistoryIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CHECKS, latestResults, type Run } from "@/lib/qa/model";
import { useQA } from "@/lib/qa/store";
import { toast } from "sonner";
import { ContactSnapshot } from "./contact-preview";
import {
  CheckDefinition,
  QAEmpty,
  QAInboxButton,
  QASelect,
  QAStatus,
  money,
} from "./qa-shared";

export function RunCost({ run }: { run: Run }) {
  return (
    <Collapsible>
      <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>
        <HistoryIcon aria-hidden data-icon="inline-start" />
        AI usage · {money(run.cost)}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-3 py-4 text-xs leading-5 text-muted-foreground">
          {run.results
            .filter((result) =>
              result.attempts.some((attempt) => attempt.inputTokens),
            )
            .map((result) => (
              <div className="flex justify-between gap-3" key={result.checkId}>
                <span>
                  {result.checkId} · {result.attempts.length} attempts
                </span>
                <span className="tabular-nums">
                  {money(
                    result.attempts.reduce((n, attempt) => n + attempt.cost, 0),
                  )}
                </span>
              </div>
            ))}
          <p>
            Illustrative recorded usage includes failed attempts and retries.
            Fixture rates: $2/M input and $8/M output. Coded checks use no AI
            tokens. This is not provider telemetry.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
export function Results({ running }: { onRun: () => void; running: boolean }) {
  const s = useQA();
  const wasEvidence = useRef(false);
  useEffect(() => {
    if (s.evidenceOpen) document.getElementById("qa-evidence-title")?.focus();
    else if (wasEvidence.current)
      document.getElementById(`evidence-${s.activeCheck}`)?.focus();
    wasEvidence.current = s.evidenceOpen;
  }, [s.evidenceOpen, s.activeCheck]);
  const [filter, setFilter] = useState("all");
  const evidence = s.evidenceOpen;
  const setEvidence = s.setEvidenceOpen;
  const run = s.runs.find((run) => run.id === s.activeRun) ?? s.runs.at(-1);
  if (!run)
    return (
      <QAEmpty
        title="Ready for your first run"
        description="Select your checks and start a run. Review the results here."
        action="Choose checks"
        onAction={() => s.setTab("plan")}
      />
    );
  const selected =
    run.results.find((result) => result.checkId === s.activeCheck) ??
    run.results[0];
  const check = CHECKS.find((check) => check.id === selected.checkId)!;
  const latest = latestResults(s.runs, s.build);
  const stale = run.build !== s.build && check.affected;
  const current = !stale && latest.get(check.id)?.run.id === run.id;
  const visible = run.results.filter(
    (result) => filter === "all" || result.outcome === filter,
  );
  const failed = run.results.filter(
    (result) => result.outcome === "failed",
  ).length;
  const blocked = run.results.filter(
    (result) => result.outcome === "blocked",
  ).length;
  const flaky = run.results.filter(
    (result) => result.outcome === "flaky",
  ).length;
  const passed = run.results.filter(
    (result) => result.outcome === "passed",
  ).length;
  const openIssue = s.issues.find((issue) => issue.status !== "resolved");
  const currentRun = s.runs.findLast((item) => item.build === s.build);
  const showEvidence = (id: string) => {
    s.inspectResult(run.id, id);
  };
  if (evidence)
    return (
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <section
          aria-label="Check evidence"
          className="mx-auto flex max-w-3xl flex-col gap-6 px-6 pb-12"
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => setEvidence(false)}
          >
            <ArrowLeftIcon aria-hidden /> All results
          </Button>
          <div className="flex flex-col gap-2">
            <h2
              id="qa-evidence-title"
              tabIndex={-1}
              className="text-lg font-medium outline-none"
            >
              {check.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              Run {run.id} · Build {run.build} · {check.runner} · {check.device}
            </p>
          </div>
          <div>
            <QAStatus status={stale ? "stale" : selected.outcome} />
          </div>
          <dl className="flex flex-col gap-5 text-sm leading-6">
            <div>
              <dt className="mb-1 text-xs text-muted-foreground">Expected</dt>
              <dd>{check.expected}</dd>
            </div>
            <div>
              <dt className="mb-1 text-xs text-muted-foreground">Actual</dt>
              <dd>{selected.actual}</dd>
            </div>
          </dl>
          {check.id === "C02" && s.issues.length > 0 && (
            <Button
              className="w-fit"
              onClick={() => {
                setEvidence(false);
                s.setTab("issues");
              }}
            >
              {s.issues.some((issue) => issue.status !== "resolved")
                ? "Review and fix"
                : "View issue"}{" "}
              <ArrowRightIcon aria-hidden data-icon="inline-end" />
            </Button>
          )}
          {check.id === "C02" && (
            <div className="flex max-w-md flex-col gap-4">
              <ContactSnapshot
                build={run.build}
                annotation={run.build === 12}
              />
              {run.build === 12 && (
                <Collapsible>
                  <CollapsibleTrigger
                    render={<Button variant="outline" size="sm" />}
                  >
                    Compare with expected behavior
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <ContactSnapshot build={13} expected />
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}
          <Separator />
          <Collapsible>
            <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>
              Steps and execution details
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <CheckDefinition steps={check.steps} expected={check.expected} />
            </CollapsibleContent>
          </Collapsible>
          <div className="flex flex-col gap-3">
            {selected.attempts.map((attempt, index) => (
              <Collapsible key={index}>
                <CollapsibleTrigger
                  render={
                    <Button
                      variant="outline"
                      className="w-full justify-between whitespace-normal text-start"
                    />
                  }
                >
                  {index ? `Retry ${index}` : "Attempt 1"} · {attempt.outcome}
                  <span className="tabular-nums">
                    {attempt.duration} · {money(attempt.cost)}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex flex-col gap-3 py-4 text-xs">
                    <pre className="whitespace-pre-wrap break-words rounded-lg bg-muted p-4 leading-6">
                      {attempt.log}
                    </pre>
                    <p className="text-muted-foreground">
                      {attempt.inputTokens.toLocaleString()} input ·{" "}
                      {attempt.outputTokens.toLocaleString()} output tokens
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
          {selected.outcome === "flaky" && (
            <LabelledAttemptReview current={current} />
          )}
          {selected.outcome === "blocked" && (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                No test inbox was configured for this run.
              </p>
              <QAInboxButton />
              {s.inbox && (
                <Button
                  onClick={() => {
                    setEvidence(false);
                    s.setTab("plan");
                  }}
                >
                  Choose checks and rerun{" "}
                  <ArrowRightIcon aria-hidden data-icon="inline-end" />
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    );
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 pb-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-medium">Test results</h2>
            <p className="text-sm text-muted-foreground">
              Run {run.id} · Build {run.build} · {run.results.length} checks
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {s.runs.length > 1 && (
              <QASelect
                label="Run history"
                value={String(run.id)}
                items={[...s.runs].reverse().map((run) => ({
                  value: String(run.id),
                  label: `Run ${run.id} · build ${run.build}`,
                }))}
                onChange={(value) =>
                  s.selectResult(Number(value), s.activeCheck)
                }
              />
            )}
            <Button
              variant="outline"
              onClick={() => s.setTab("plan")}
              disabled={running}
            >
              <PlusIcon aria-hidden data-icon="inline-start" />
              New run
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{passed} passed</Badge>
          {failed > 0 && <Badge variant="destructive">{failed} failed</Badge>}
          {blocked > 0 && <Badge variant="secondary">{blocked} blocked</Badge>}
          {flaky > 0 && <Badge variant="secondary">{flaky} flaky</Badge>}
        </div>
        {run.build !== s.build ? (
          <Alert role="status">
            <TriangleAlertIcon aria-hidden />
            <AlertTitle>Results from build {run.build}</AlertTitle>
            <AlertDescription>
              <p>
                Changed checks are stale. Their original evidence stays in
                history.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  if (currentRun) {
                    s.selectResult(currentRun.id, s.activeCheck);
                    setFilter("all");
                  } else {
                    s.setScope("release");
                    s.setTab("plan");
                  }
                }}
              >
                {currentRun ? "View current results" : "Choose retest checks"}{" "}
                <ArrowRightIcon aria-hidden data-icon="inline-end" />
              </Button>
            </AlertDescription>
          </Alert>
        ) : openIssue ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Fix the failed check, then run again.
            </p>
            <Button onClick={() => s.setTab("issues")}>
              Review and fix{" "}
              <ArrowRightIcon aria-hidden data-icon="inline-end" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {flaky && !s.flakyReviewed
                ? "One check passed on retry. Review both attempts."
                : blocked
                  ? "Connect the test inbox, then run again."
                  : "All checks reviewed. Continue to the release decision."}
            </p>
            <Button
              onClick={() => {
                const retry = run.results.find(
                  (result) => result.outcome === "flaky",
                );
                const setup = run.results.find(
                  (result) => result.outcome === "blocked",
                );
                if (setup) s.inspectResult(run.id, setup.checkId);
                else if (retry && !s.flakyReviewed)
                  s.inspectResult(run.id, retry.checkId);
                else s.setTab("release");
              }}
            >
              {blocked
                ? "Resolve setup"
                : flaky && !s.flakyReviewed
                  ? "Review retry"
                  : "Review release"}{" "}
              <ArrowRightIcon aria-hidden data-icon="inline-end" />
            </Button>
          </div>
        )}
        {run.results.length > 5 && (
          <div className="flex justify-end">
            <QASelect
              label="Filter results"
              value={filter}
              items={[
                { value: "all", label: "All results" },
                { value: "failed", label: "Failed" },
                { value: "blocked", label: "Blocked" },
                { value: "flaky", label: "Flaky" },
                { value: "passed", label: "Passed" },
              ]}
              onChange={setFilter}
            />
          </div>
        )}
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Check</TableHead>
                <TableHead className="hidden sm:table-cell">Result</TableHead>
                <TableHead className="hidden w-24 sm:table-cell">
                  Attempts
                </TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">View evidence</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...visible]
                .sort(
                  (a, b) =>
                    ["failed", "blocked", "flaky", "passed"].indexOf(
                      a.outcome,
                    ) -
                    ["failed", "blocked", "flaky", "passed"].indexOf(b.outcome),
                )
                .map((result) => {
                  const check = CHECKS.find(
                    (check) => check.id === result.checkId,
                  )!;
                  return (
                    <TableRow key={check.id}>
                      <TableCell className="whitespace-normal">
                        <Button
                          variant="ghost"
                          className="h-auto justify-start whitespace-normal px-0 text-start"
                          onClick={() => showEvidence(check.id)}
                        >
                          {check.title}
                        </Button>
                        <div className="mt-2 sm:hidden">
                          <QAStatus
                            status={
                              run.build !== s.build && check.affected
                                ? "stale"
                                : result.outcome
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <QAStatus
                          status={
                            run.build !== s.build && check.affected
                              ? "stale"
                              : result.outcome
                          }
                        />
                      </TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">
                        {result.attempts.length || "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          id={`evidence-${check.id}`}
                          aria-label={`View evidence for ${check.title}`}
                          onClick={() => showEvidence(check.id)}
                        >
                          <ChevronRightIcon aria-hidden />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          {!visible.length && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No {filter} checks in this run. Choose All results to see the
              evidence.
            </div>
          )}
        </div>
        <RunCost run={run} />
      </div>
    </div>
  );
}
function LabelledAttemptReview({ current }: { current: boolean }) {
  const reviewed = useQA((s) => s.flakyReviewed);
  const review = useQA((s) => s.reviewFlaky);
  return (
    <div className="flex flex-col items-start gap-4">
      <label className="flex items-start gap-3 text-sm leading-6">
        <Checkbox
          className="mt-1"
          checked={current && reviewed}
          disabled={!current}
          onCheckedChange={(value) => {
            review(value);
            if (value) toast.success("Retry reviewed");
          }}
        />
        {current
          ? "I reviewed both attempts. Track response timing as a known limitation."
          : "Review the latest run on the current build to accept this limitation."}
      </label>
      {current && reviewed && (
        <Button onClick={() => useQA.getState().setTab("release")}>
          Review release
          <ArrowRightIcon aria-hidden />
        </Button>
      )}
    </div>
  );
}
