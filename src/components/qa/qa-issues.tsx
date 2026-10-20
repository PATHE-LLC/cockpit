"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useQA } from "@/lib/qa/store";
import { ContactSnapshot } from "./contact-preview";
import { QAEmpty, QASection } from "./qa-shared";

export function Issues() {
  const s = useQA();
  const [working, setWorking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const issue = s.issues[0];
  const prepareRetest = () => {
    s.setScope("release");
    s.setTab("plan");
  };
  const change = (apply: boolean) => {
    setWorking(true);
    timer.current = setTimeout(() => {
      if (apply) {
        s.fix();
        toast.success("Build 13 ready", {
          description: "Run the checks again to verify the fix.",
        });
      } else {
        s.startFix();
        toast.success("Fix prepared");
      }
      setWorking(false);
    }, 750);
  };
  if (!issue)
    return (
      <QAEmpty
        title="No issues to fix"
        description="Run your checks to find issues that need attention."
        action="Choose checks"
        onAction={() => s.setTab("plan")}
      />
    );
  const status = {
    open: "Open",
    "in-progress": "Fix prepared",
    fixed: "Needs retest",
    resolved: "Resolved",
  }[issue.status];
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 pb-12">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => s.setTab("results")}
        >
          <ArrowLeftIcon aria-hidden /> All results
        </Button>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">QA-104</span>
            <Badge
              variant={issue.status === "resolved" ? "default" : "secondary"}
            >
              {status}
            </Badge>
          </div>
          <h2 className="text-lg font-medium leading-7">{issue.title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {issue.status === "fixed"
              ? "The fix is in build 13. Run a fresh check to confirm it works."
              : issue.status === "resolved"
                ? "Verified on build 13. The message stays in the form after a failed request."
                : "A failed request clears the customer's message. Keep it in the form so they can retry."}
          </p>
        </div>
        {issue.status === "in-progress" && (
          <QASection title="Proposed fix">
            <p className="text-sm text-muted-foreground">
              Reset the form only after a successful response.
            </p>
            <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs leading-7">
              <code>
                {
                  "- form.reset();\n  const response = await sendMessage(values);\n+ if (response.ok) form.reset();"
                }
              </code>
            </pre>
            <p className="text-xs text-muted-foreground">
              Applying this demo change creates build 13.
            </p>
          </QASection>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={working}
            onClick={() =>
              issue.status === "open"
                ? change(false)
                : issue.status === "in-progress"
                  ? change(true)
                  : issue.status === "fixed"
                    ? prepareRetest()
                    : s.setTab("release")
            }
          >
            {working ? (
              <Loader2Icon aria-hidden className="motion-safe:animate-spin" />
            ) : (
              <ArrowRightIcon aria-hidden />
            )}
            {working
              ? issue.status === "open"
                ? "Preparing fix…"
                : "Applying fix…"
              : issue.status === "open"
                ? "Prepare fix"
                : issue.status === "in-progress"
                  ? "Apply demo fix"
                  : issue.status === "fixed"
                    ? "Choose retest checks"
                    : "Review release"}
          </Button>
          <a
            href={`/preview/forme?build=${s.build}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "ghost" })}
          >
            <ExternalLinkIcon aria-hidden />
            Try in store
          </a>
        </div>
        <Separator />
        <dl className="grid gap-5 text-sm leading-6 sm:grid-cols-2">
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
        <Collapsible>
          <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>
            Original evidence and history
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex flex-col gap-5 py-4">
              <div className="max-w-sm">
                <ContactSnapshot build={issue.originalBuild} annotation />
              </div>
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => {
                  const run = s.runs.find((run) =>
                    run.results.some((result) => result.checkId === "C02"),
                  );
                  if (run) s.inspectResult(run.id, "C02");
                }}
              >
                View original test evidence <ArrowRightIcon aria-hidden />
              </Button>
              <ol className="flex flex-col gap-3 text-xs leading-5 text-muted-foreground">
                <li>Issue opened on build {issue.originalBuild}.</li>
                {issue.status !== "open" && (
                  <li>Fix prepared: reset moved to the success handler.</li>
                )}
                {issue.fixedBuild && (
                  <li>
                    Build {issue.fixedBuild} created. Affected evidence marked
                    stale.
                  </li>
                )}
                {issue.status === "resolved" && (
                  <li>Retest passed on build 13. Issue resolved.</li>
                )}
              </ol>
            </div>
          </CollapsibleContent>
        </Collapsible>
        {s.feedback.length > 0 && (
          <QASection
            title="Tester feedback"
            detail={`${s.feedback.length} linked reports`}
          >
            {s.feedback.map((feedback) => (
              <Collapsible key={feedback.id}>
                <CollapsibleTrigger
                  render={
                    <Button
                      variant="outline"
                      className="h-auto w-full justify-between whitespace-normal py-3 text-start"
                    />
                  }
                >
                  {feedback.description}
                  <span className="shrink-0 text-xs">{feedback.id}</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex flex-col gap-4 py-4 text-sm leading-6">
                    <dl className="flex flex-col gap-3">
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
                      Build {feedback.build} · {feedback.category} ·{" "}
                      {feedback.page} · {feedback.device}
                    </p>
                    <div className="max-w-sm">
                      <ContactSnapshot
                        build={feedback.build}
                        annotation={feedback.annotation}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </QASection>
        )}
      </div>
    </div>
  );
}
