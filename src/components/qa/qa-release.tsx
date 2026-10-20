"use client";

import { useState } from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CHECKS, latestResults, releaseBlockers } from "@/lib/qa/model";
import { useQA } from "@/lib/qa/store";
import { QASection, QAStatus, money } from "./qa-shared";

export function ReleaseReview() {
  const s = useQA();
  const [note, setNote] = useState(s.decision?.note ?? "");
  const [hold, setHold] = useState(false);
  const blockers = releaseBlockers(s.runs, s.build, s.issues, s.flakyReviewed);
  const latest = latestResults(s.runs, s.build);
  const ready = !blockers.length && s.gapsAccepted && s.signoffs.length === 3;
  const flaky = [...latest.values()].find(
    (item) => !item.stale && item.result.outcome === "flaky",
  );
  const issue = s.issues.find((item) => item.status !== "resolved");
  const needsRun = blockers.some((blocker) =>
    /release pass|stale|failed|blocked/.test(blocker),
  );
  const nextLabel =
    issue && issue.status !== "fixed"
      ? "Fix the open issue"
      : needsRun
        ? "Choose release checks"
        : "Review flaky check";
  const nextAction = () => {
    if (issue && issue.status !== "fixed") s.setTab("issues");
    else if (needsRun) {
      s.setScope("release");
      s.setTab("plan");
    } else if (flaky) s.inspectResult(flaky.run.id, flaky.result.checkId);
  };
  const currentCount = [...latest.values()].filter(
    (item) => item.run.build === s.build,
  ).length;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex max-w-3xl flex-col gap-7 px-6 pb-12">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">
            {s.decision?.kind === "approved"
              ? `Build ${s.build} approved`
              : s.decision?.kind === "held"
                ? "Release on hold"
                : "Release review"}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {s.decision
              ? "Decision saved locally. No deployment was triggered."
              : blockers.length
                ? "Finish the remaining checks before approving this build."
                : "Review the coverage and collect sign-offs to approve this build."}
          </p>
          {s.decision?.note && (
            <p className="text-sm leading-6">{s.decision.note}</p>
          )}
        </div>
        <section
          data-tour="qa-release-evidence"
          className="flex flex-col gap-2 border-y py-2"
        >
          <Accordion>
            <AccordionItem value="evidence">
              <AccordionTrigger>
                <span>Release evidence</span>
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {currentCount} of 11 · Build {s.build}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <p className="mb-4 text-xs text-muted-foreground">
                  Select a check to inspect its build, expected result and
                  recorded attempts.
                </p>
                <ul className="flex flex-col divide-y">
                  {CHECKS.map((check) => {
                    const item = latest.get(check.id);
                    return (
                      <li key={check.id}>
                        <button
                          disabled={!item}
                          onClick={() =>
                            item && s.inspectResult(item.run.id, check.id)
                          }
                          className="flex w-full items-center justify-between gap-3 rounded-lg py-3 text-left text-sm outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default"
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
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="usage">
              <AccordionTrigger>
                <span>Usage across all runs</span>
                <span className="ml-auto text-xs font-normal tabular-nums text-muted-foreground">
                  {money(s.runs.reduce((n, run) => n + run.cost, 0))} ·{" "}
                  {s.runs.length} runs
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="flex flex-col divide-y">
                  {s.runs.map((run) => (
                    <li key={run.id}>
                      <button
                        className="flex w-full items-center justify-between gap-3 rounded-lg py-3 text-left text-sm outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
                        onClick={() => {
                          s.selectResult(run.id, s.activeCheck);
                          s.setTab("results");
                        }}
                      >
                        <span>
                          Run {run.id} · Build {run.build}
                        </span>
                        <span className="flex items-center gap-2 tabular-nums">
                          {money(run.cost)}
                          <ArrowRightIcon aria-hidden className="size-3.5" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {s.runs
                    .reduce((n, run) => n + run.tokens, 0)
                    .toLocaleString()}{" "}
                  tokens. Includes failed attempts and retries. All usage is
                  illustrative.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
        {blockers.length > 0 ? (
          <QASection title="Before you can approve">
            <ul className="flex flex-col gap-4">
              {[
                {
                  show: issue && issue.status !== "fixed",
                  text: "Fix the contact form issue.",
                },
                {
                  show: needsRun,
                  text: `Run all 11 release checks on build ${s.build}.`,
                },
                {
                  show: flaky && !s.flakyReviewed,
                  text: "Review the check that passed on retry.",
                },
              ]
                .filter((item) => item.show)
                .map((item) => (
                  <li
                    key={item.text}
                    className="flex items-start gap-3 text-sm leading-6"
                  >
                    <CircleDashedIcon
                      aria-hidden
                      className="mt-1 size-4 shrink-0 text-muted-foreground"
                    />
                    {item.text}
                  </li>
                ))}
            </ul>
            <Button className="mt-2 w-fit" onClick={nextAction}>
              {nextLabel}
              <ArrowRightIcon aria-hidden />
            </Button>
          </QASection>
        ) : (
          <div className="flex flex-col gap-7">
            <p className="flex items-center gap-2 text-sm">
              <CheckCircle2Icon aria-hidden className="size-4" />
              All 11 release checks reviewed on build {s.build}.
            </p>
            <QASection title="Accept coverage limits">
              <p className="text-sm leading-6 text-muted-foreground">
                Desktop Chrome and a mobile viewport were tested. Real payments,
                production email, other browsers and a full security review are
                outside this release check.
              </p>
              <label className="flex items-start gap-3 text-sm leading-6">
                <Checkbox
                  className="mt-1"
                  checked={s.gapsAccepted}
                  onCheckedChange={s.acceptGaps}
                />
                I reviewed and accept these coverage limits.
              </label>
            </QASection>
            <Separator />
            <fieldset
              className="flex min-w-0 flex-col gap-4"
              data-tour="qa-release-form"
            >
              <legend className="mb-4 text-sm font-medium">
                Reviewer sign-offs{" "}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {s.signoffs.length} of 3
                </span>
              </legend>
              <div className="flex flex-col gap-4">
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
                    className="flex items-center gap-3 text-sm"
                  >
                    <Checkbox
                      checked={s.signoffs.includes(person.key)}
                      onCheckedChange={() => s.signoff(person.key)}
                    />
                    <span>
                      {person.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {person.role}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Demo sign-offs only; these controls do not authenticate
                reviewers.
              </p>
            </fieldset>
          </div>
        )}
        <section
          className="flex flex-col gap-4 border-t pt-6"
          data-tour="qa-decision"
        >
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">Release decision</h3>
            <p className="text-xs leading-5 text-muted-foreground">
              {blockers.length
                ? "Approval is unavailable until the checks above are complete. You can hold the release with a reason."
                : "Approve this build, or hold it and explain what needs to change."}
            </p>
          </div>
          {!blockers.length && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="release-note">
                Decision note{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="release-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything the release owner should know?"
              />
            </div>
          )}
          {!blockers.length && !ready && (
            <p className="text-xs text-muted-foreground">
              {!s.gapsAccepted
                ? "Accept the coverage limits to continue."
                : `${3 - s.signoffs.length} sign-offs still needed.`}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {!blockers.length && (
              <Button
                disabled={!ready || s.decision?.kind === "approved"}
                onClick={() => {
                  s.decide("approved", note);
                  toast.success(`Build ${s.build} approved`, {
                    description:
                      "Release decision saved. No deployment triggered.",
                  });
                }}
              >
                <ShieldCheckIcon aria-hidden />
                {s.decision?.kind === "approved"
                  ? "Approved"
                  : "Approve demo release"}
              </Button>
            )}
            <Button variant="outline" onClick={() => setHold(true)}>
              Hold release
            </Button>
          </div>
        </section>
        <Dialog open={hold} onOpenChange={setHold}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hold this release?</DialogTitle>
              <DialogDescription>
                Add a reason so the next reviewer knows what needs to change.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Label htmlFor="hold-note">Reason for holding</Label>
              <Textarea
                id="hold-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What needs to happen before release?"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setHold(false)}>
                Cancel
              </Button>
              <Button
                disabled={!note.trim()}
                onClick={() => {
                  s.decide("held", note);
                  setHold(false);
                  toast.success("Release held", {
                    description: "Your reason has been saved.",
                  });
                }}
              >
                Hold release
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
