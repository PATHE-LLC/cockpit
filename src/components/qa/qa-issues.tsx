"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  CircleDashedIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQA } from "@/lib/qa/store";
import { estimatedCost, estimatedMinutes, idsForScope } from "@/lib/qa/model";
import { QAInboxButton } from "./qa-shared";
import { ContactSnapshot } from "./contact-preview";

export function IssueResolution({ onRetest }: { onRetest: () => void }) {
  const s = useQA();
  const issue = s.issues[0];
  const [working, setWorking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  if (!issue) return null;
  const phase =
    issue.status === "resolved" ? 2 : issue.status === "fixed" ? 1 : 0;
  const fix = () => {
    if (working) return;
    setWorking(true);
    s.startFix();
    timer.current = setTimeout(() => {
      useQA.getState().fix();
      setWorking(false);
      toast.success("Fix applied to build 13", {
        description: "Retest the release checks to verify it.",
      });
    }, 900);
  };
  return (
    <section
      data-tour="qa-fix"
      className="flex flex-col gap-4 rounded-xl border p-4"
    >
      <ol className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
        {["Fix issue", "Retest fix", "Review release"].map((label, index) => (
          <li
            key={label}
            className={`flex items-center gap-1.5 ${index === phase ? "font-medium" : "text-muted-foreground"}`}
          >
            {index < phase ? (
              <CheckIcon aria-hidden className="size-3.5" />
            ) : (
              <CircleDashedIcon aria-hidden className="size-3.5" />
            )}
            {label}
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">
          {phase === 0
            ? "Keep the message when sending fails"
            : phase === 1
              ? "Fix applied · Build 13"
              : "Fix verified · Build 13"}
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {phase === 0
            ? "Reset the form only after a successful request. This demo fix creates a new build."
            : phase === 1
              ? "Run all 11 release checks on build 13 to verify the fix and the rest of the project."
              : "The retest confirms the message is preserved. Continue to the release decision."}
        </p>
      </div>
      {phase === 1 && !s.inbox && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Connect the test inbox before the release retest.
          </p>
          <QAInboxButton />
        </div>
      )}
      {phase === 1 && (
        <p className="text-xs text-muted-foreground">
          11 checks · About {estimatedMinutes(idsForScope("release"))} min · $
          {estimatedCost(idsForScope("release")).toFixed(2)} estimated AI usage,
          including retries
        </p>
      )}
      <Button
        className="w-fit"
        disabled={working || (phase === 1 && !s.inbox)}
        onClick={() =>
          phase === 0 ? fix() : phase === 1 ? onRetest() : s.setTab("release")
        }
      >
        {working ? (
          <Loader2Icon aria-hidden className="motion-safe:animate-spin" />
        ) : (
          <ArrowRightIcon aria-hidden />
        )}
        {working
          ? "Applying fix…"
          : phase === 0
            ? "Fix issue"
            : phase === 1
              ? "Retest fix"
              : "Review release"}
      </Button>
    </section>
  );
}

export function Issues({ onRetest }: { onRetest: () => void }) {
  const s = useQA();
  const issue = s.issues[0];
  if (!issue) return null;
  return (
    <section
      aria-label="Issue details"
      className="flex flex-col gap-6"
      data-tour="qa-evidence"
    >
      <div className="flex flex-col gap-2">
        <div>
          <Badge variant="secondary">{issue.id}</Badge>
        </div>
        <h2
          id="qa-evidence-title"
          tabIndex={-1}
          className="text-lg font-medium leading-7 outline-none"
        >
          {issue.title}
        </h2>
        <p className="text-xs text-muted-foreground">
          First seen on build {issue.originalBuild} · Contact form
        </p>
      </div>
      <dl className="grid gap-5 text-sm leading-6 @lg/qa-detail:grid-cols-2">
        <div>
          <dt className="mb-1 text-xs text-muted-foreground">Expected</dt>
          <dd>The message stays in the form, ready to retry.</dd>
        </div>
        <div>
          <dt className="mb-1 text-xs text-muted-foreground">
            Actual · Build {issue.originalBuild}
          </dt>
          <dd>The error appears and the message field is empty.</dd>
        </div>
      </dl>
      <IssueResolution onRetest={onRetest} />
      <Accordion>
        <AccordionItem value="original">
          <AccordionTrigger>Original evidence and change</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              <div className="max-w-sm">
                <ContactSnapshot build={issue.originalBuild} annotation />
              </div>
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-6">
                <code>
                  {
                    "- form.reset();\n  const response = await sendMessage(values);\n+ if (response.ok) form.reset();"
                  }
                </code>
              </pre>
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => {
                  const run = s.runs.find((run) =>
                    run.results.some((r) => r.checkId === "C02"),
                  );
                  if (run) s.inspectResult(run.id, "C02");
                }}
              >
                View original test
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
        {s.feedback.length > 0 && (
          <AccordionItem value="feedback">
            <AccordionTrigger>
              Tester feedback{" "}
              <span className="ml-auto text-xs text-muted-foreground">
                {s.feedback.length} reports
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-6">
                {s.feedback.map((feedback) => (
                  <div key={feedback.id} className="flex flex-col gap-3">
                    <p className="font-medium">{feedback.description}</p>
                    <dl className="grid gap-4 @lg/qa-detail:grid-cols-2">
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Expected
                        </dt>
                        <dd>{feedback.expected}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Actual
                        </dt>
                        <dd>{feedback.actual}</dd>
                      </div>
                    </dl>
                    <p className="text-xs text-muted-foreground">
                      {feedback.id} · Build {feedback.build} ·{" "}
                      {feedback.category} · {feedback.page} · {feedback.device}
                    </p>
                    <div className="max-w-sm">
                      <ContactSnapshot
                        build={feedback.build}
                        annotation={feedback.annotation}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </section>
  );
}
