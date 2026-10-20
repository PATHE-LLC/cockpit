"use client";

import { useState } from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ShieldCheckIcon,
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CHECKS, latestResults, releaseBlockers } from "@/lib/qa/model";
import { useQA } from "@/lib/qa/store";
import { QASection, QAStatus, money } from "./qa-shared";

export function ReleaseReview() {
  const s = useQA();
  const [note, setNote] = useState(s.decision?.note ?? "");
  const blockers = releaseBlockers(s.runs, s.build, s.issues, s.flakyReviewed);
  const latest = latestResults(s.runs, s.build);
  const untested = CHECKS.filter((check) => !latest.has(check.id));
  const ready = !blockers.length && s.gapsAccepted && s.signoffs.length === 3;
  const flaky = [...latest.values()].find(
    (item) => !item.stale && item.result.outcome === "flaky",
  );
  const prepare = () => {
    s.setScope("release");
    s.setTab("plan");
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex max-w-5xl flex-col gap-7 px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Release review
              </h1>
              <p className="text-sm text-muted-foreground">
                Build {s.build} · Review the evidence and record a human
                decision.
              </p>
            </div>
            <Badge variant={ready ? "default" : "secondary"}>
              {s.decision?.kind === "approved"
                ? "Approved"
                : s.decision?.kind === "held"
                  ? "Held"
                  : ready
                    ? "Ready for a decision"
                    : "Review required"}
            </Badge>
          </div>
          <QASection
            title="Checks and issues"
            detail={
              blockers.length ? `${blockers.length} to address` : "Complete"
            }
          >
            {blockers.length ? (
              <>
                <ul className="flex flex-col gap-3">
                  {blockers.map((blocker) => (
                    <li
                      className="flex items-start gap-3 text-sm leading-6"
                      key={blocker}
                    >
                      <TriangleAlertIcon
                        aria-hidden
                        className="mt-1 size-4 shrink-0 text-muted-foreground"
                      />
                      {blocker}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  {blockers.some((blocker) =>
                    /release pass|stale|failed|blocked/.test(blocker),
                  ) && (
                    <Button variant="outline" size="sm" onClick={prepare}>
                      Choose release checks{" "}
                      <ArrowRightIcon aria-hidden data-icon="inline-end" />
                    </Button>
                  )}
                  {s.issues.some((issue) => issue.status !== "resolved") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => s.setTab("issues")}
                    >
                      Review issue
                    </Button>
                  )}
                  {flaky && !s.flakyReviewed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        s.inspectResult(flaky.run.id, flaky.result.checkId);
                      }}
                    >
                      Review flaky check
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm">
                <CheckCircle2Icon aria-hidden className="size-4" />
                The agreed release pass is complete on build {s.build}.
              </p>
            )}
            {latest.size > 0 && (
              <Collapsible>
                <CollapsibleTrigger
                  render={<Button variant="ghost" size="sm" />}
                >
                  View all {latest.size} check results
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex flex-col py-3">
                    {CHECKS.map((check) => {
                      const item = latest.get(check.id);
                      return (
                        <div
                          className="flex items-center justify-between gap-3 py-2 text-xs"
                          key={check.id}
                        >
                          <span>{check.title}</span>
                          <QAStatus
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
                </CollapsibleContent>
              </Collapsible>
            )}
          </QASection>
          <Separator />
          <QASection
            title="Coverage limits"
            detail={`${untested.length} not tested`}
          >
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              This checklist covers desktop Chrome and a mobile viewport. Real
              payments, production email, other browsers and comprehensive
              security testing are excluded.
            </p>
            {untested.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger
                  render={<Button variant="ghost" size="sm" />}
                >
                  View untested checks
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="flex flex-col gap-2 py-3 text-xs text-muted-foreground">
                    {untested.map((check) => (
                      <li key={check.id}>{check.title}</li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            )}
            <label className="flex items-start gap-3 text-sm leading-6">
              <Checkbox
                className="mt-1"
                checked={s.gapsAccepted}
                onCheckedChange={s.acceptGaps}
              />
              I reviewed the untested areas and accept these limits for this
              demo release.
            </label>
          </QASection>
          <Separator />
          <fieldset className="flex min-w-0 flex-col gap-4">
            <legend className="mb-4 text-sm font-medium">
              Reviewer sign-offs{" "}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {s.signoffs.length} of 3
              </span>
            </legend>
            <div className="grid gap-4 md:grid-cols-3">
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
                  className="flex items-start gap-3 text-sm leading-6"
                  key={person.key}
                >
                  <Checkbox
                    className="mt-1"
                    checked={s.signoffs.includes(person.key)}
                    onCheckedChange={() => s.signoff(person.key)}
                    disabled={blockers.length > 0}
                  />
                  <span>
                    {person.name}
                    <span className="block text-xs text-muted-foreground">
                      {person.role}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Illustrative reviewer assignments. These controls simulate
              sign-off and do not authenticate anyone.
            </p>
          </fieldset>
          <Separator />
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
            <div className="flex flex-col gap-3">
              <Label htmlFor="release-note">Decision notes</Label>
              <Textarea
                id="release-note"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Context for approval, or a reason to hold…"
              />
            </div>
            <dl className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Recorded AI spend</dt>
                <dd className="tabular-nums">
                  {money(s.runs.reduce((n, run) => n + run.cost, 0))}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Runs / tokens</dt>
                <dd className="tabular-nums">
                  {s.runs.length} /{" "}
                  {s.runs
                    .reduce((n, run) => n + run.tokens, 0)
                    .toLocaleString()}
                </dd>
              </div>
              <p className="leading-5 text-muted-foreground">
                Illustrative usage includes all failed attempts and retries.
              </p>
            </dl>
          </div>
          {s.decision && (
            <Alert role="status">
              <CheckCircle2Icon aria-hidden />
              <AlertTitle>
                Build {s.decision.build} ·{" "}
                {s.decision.kind === "approved"
                  ? "Approved for demo release"
                  : "Release held"}
              </AlertTitle>
              <AlertDescription>
                {s.decision.note && <p>{s.decision.note}</p>}
                <p>Decision saved locally. No deployment was triggered.</p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      <Separator />
      <footer className="shrink-0 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className="max-w-lg text-xs leading-5 text-muted-foreground">
            {ready
              ? "All requirements and sign-offs are complete."
              : "Complete checks, accept coverage limits and collect all three sign-offs to approve."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!note.trim()}
              onClick={() => s.decide("held", note)}
            >
              Hold release
            </Button>
            <Button
              disabled={!ready}
              onClick={() => s.decide("approved", note)}
            >
              <ShieldCheckIcon aria-hidden data-icon="inline-start" />
              Approve demo release
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
