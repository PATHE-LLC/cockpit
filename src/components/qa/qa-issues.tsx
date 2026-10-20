"use client";

import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  GitBranchIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useQA } from "@/lib/qa/store";
import { ContactSnapshot } from "./contact-preview";
import { QAEmpty, QASection } from "./qa-shared";

export function Issues({ openPreview }: { openPreview: () => void }) {
  const s = useQA();
  const issue = s.issues[0];
  if (!issue)
    return (
      <QAEmpty
        title="No issues yet"
        description="Run the checks, or try the storefront and report a problem. Test findings and human feedback meet here."
        action="Open storefront"
        onAction={openPreview}
      />
    );
  const status =
    issue.status === "in-progress"
      ? "In progress"
      : issue.status === "fixed"
        ? "Needs retest"
        : issue.status === "resolved"
          ? "Resolved"
          : "Open";
  const next = () => {
    s.setScope("release");
    s.setTab("plan");
  };
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex max-w-5xl flex-col gap-7 px-5 py-7 sm:px-8 sm:py-9">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex max-w-2xl flex-col gap-3">
            <h1 className="text-xl font-semibold leading-8 tracking-tight">
              {issue.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Badge
                variant={issue.status === "resolved" ? "default" : "secondary"}
              >
                {status}
              </Badge>
              <span>
                QA-104 · Contact form · First seen in build{" "}
                {issue.originalBuild}
              </span>
            </div>
          </div>
          {issue.status === "open" ? (
            <Button onClick={s.startFix}>
              <GitBranchIcon aria-hidden data-icon="inline-start" />
              Prepare a fix
            </Button>
          ) : issue.status === "in-progress" ? (
            <Button onClick={s.fix}>
              Apply demo fix{" "}
              <ArrowRightIcon aria-hidden data-icon="inline-end" />
            </Button>
          ) : issue.status === "fixed" ? (
            <Button onClick={next}>
              Prepare retest{" "}
              <ArrowRightIcon aria-hidden data-icon="inline-end" />
            </Button>
          ) : (
            <Button onClick={() => s.setTab("release")}>
              Review release{" "}
              <ArrowRightIcon aria-hidden data-icon="inline-end" />
            </Button>
          )}
        </div>
        {issue.status === "fixed" && (
          <Alert role="status">
            <CheckCircle2Icon aria-hidden />
            <AlertTitle>Fix available in build 13</AlertTitle>
            <AlertDescription>
              The affected evidence is stale. A passing retest is required to
              resolve this issue.
            </AlertDescription>
          </Alert>
        )}
        {issue.status === "resolved" && (
          <Alert role="status">
            <CheckCircle2Icon aria-hidden />
            <AlertTitle>Verified on build 13</AlertTitle>
            <AlertDescription>
              The retest preserved the message after a failed submission.
              Original evidence remains in history.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-w-0 flex-col gap-7">
            <QASection title="The problem">
              <p className="text-sm leading-6 text-muted-foreground">
                A failed request resets the form before the customer can retry.
                Keep the message until the request succeeds.
              </p>
              <dl className="grid gap-5 text-sm leading-6 sm:grid-cols-2">
                <div>
                  <dt className="mb-1 text-xs text-muted-foreground">
                    Expected
                  </dt>
                  <dd>The message stays in the form, ready to retry.</dd>
                </div>
                <div>
                  <dt className="mb-1 text-xs text-muted-foreground">
                    Actual · build {issue.originalBuild}
                  </dt>
                  <dd>The error appears and the message field is empty.</dd>
                </div>
              </dl>
            </QASection>
            {issue.status === "in-progress" && (
              <>
                <Separator />
                <QASection title="Proposed fix">
                  <p className="text-sm text-muted-foreground">
                    Reset the form only after a successful response. Applying
                    this change creates demo build 13.
                  </p>
                  <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs leading-7">
                    <code>
                      {
                        "- form.reset();\n  const response = await sendMessage(values);\n+ if (response.ok) form.reset();"
                      }
                    </code>
                  </pre>
                </QASection>
              </>
            )}
            <Separator />
            <QASection
              title="Linked evidence"
              detail="Original report retained"
            >
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const run = s.runs.find((run) =>
                      run.results.some((result) => result.checkId === "C02"),
                    );
                    if (run) {
                      s.inspectResult(run.id, "C02");
                    } else openPreview();
                  }}
                >
                  C02 · Failed submission{" "}
                  <ArrowRightIcon aria-hidden data-icon="inline-end" />
                </Button>
                <Button variant="ghost" onClick={openPreview}>
                  <ExternalLinkIcon aria-hidden data-icon="inline-start" />
                  {s.feedback.length ? "Open storefront" : "Capture feedback"}
                </Button>
              </div>
            </QASection>
            <Separator />
            <QASection
              title="Tester feedback"
              detail={`${s.feedback.length} linked reports`}
            >
              {s.feedback.length ? (
                s.feedback.map((feedback) => (
                  <Collapsible key={feedback.id}>
                    <CollapsibleTrigger
                      render={
                        <Button
                          variant="outline"
                          className="w-full justify-between whitespace-normal text-start"
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
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No tester reports attached. Open the storefront to reproduce
                  the failure and capture feedback.
                </p>
              )}
            </QASection>
          </div>
          <aside aria-label="Issue history" className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Original capture</h3>
              <p className="text-xs text-muted-foreground">
                Build {issue.originalBuild} · /contact
              </p>
            </div>
            <ContactSnapshot build={issue.originalBuild} annotation />
            <Separator />
            <ol className="flex flex-col gap-4 text-xs leading-5">
              <li>
                <p className="font-medium">Issue opened</p>
                <p className="text-muted-foreground">
                  Message cleared on build {issue.originalBuild}.
                </p>
              </li>
              {issue.status !== "open" && (
                <li>
                  <p className="font-medium">Fix prepared</p>
                  <p className="text-muted-foreground">
                    Reset moved to the success handler.
                  </p>
                </li>
              )}
              {issue.fixedBuild && (
                <li>
                  <p className="font-medium">
                    Build {issue.fixedBuild} created
                  </p>
                  <p className="text-muted-foreground">
                    Affected evidence marked stale.
                  </p>
                </li>
              )}
              {issue.status === "resolved" && (
                <li>
                  <p className="font-medium">Retest passed</p>
                  <p className="text-muted-foreground">
                    Issue resolved on build 13.
                  </p>
                </li>
              )}
            </ol>
          </aside>
        </div>
      </div>
    </div>
  );
}
