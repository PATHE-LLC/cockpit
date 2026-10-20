"use client";

import { useState } from "react";
import {
  ChevronRightIcon,
  Loader2Icon,
  PlayIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CHECKS,
  SCOPES,
  estimatedCost,
  estimatedMinutes,
  idsForScope,
  type Check,
  type Scope,
} from "@/lib/qa/model";
import { useQA } from "@/lib/qa/store";
import {
  QASelect,
  QADetails,
  CheckDefinition,
  QAInboxButton,
  money,
} from "./qa-shared";

const scopeNames: Record<Scope, string> = {
  changed: "Quick check",
  risk: "Broader coverage",
  release: "Full release check",
};
export function RunPlan({
  running,
  onRun,
}: {
  running: boolean;
  onRun: () => void;
}) {
  const s = useQA();
  const [inspect, setInspect] = useState<Check | null>(null);
  const [setup, setSetup] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const scope = SCOPES.find((item) => item.id === s.scope)!;
  const recommended = idsForScope(s.scope);
  const custom =
    recommended.length !== s.selected.length ||
    recommended.some((id) => !s.selected.includes(id));
  const visible = CHECKS.filter(
    (check) =>
      showAll ||
      recommended.includes(check.id) ||
      s.selected.includes(check.id),
  ).sort(
    (a, b) =>
      ["Contact", "Checkout", "Cart", "Catalog"].indexOf(a.area) -
      ["Contact", "Checkout", "Cart", "Catalog"].indexOf(b.area),
  );
  const omitted = CHECKS.filter((check) => !s.selected.includes(check.id));
  const blocked = s.selected.includes("C03") && !s.inbox;
  const mobile = s.selected.some(
    (id) => CHECKS.find((check) => check.id === id)?.device === "Mobile",
  );
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pb-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-medium">Choose checks</h2>
            <p className="text-sm text-muted-foreground">
              Select what to test, then start a run.
            </p>
          </div>
          <div className="flex flex-col gap-2" data-tour="qa-coverage">
            <Label htmlFor="qa-coverage">Test coverage</Label>
            <QASelect
              id="qa-coverage"
              label="Test coverage"
              value={custom ? null : s.scope}
              placeholder="Custom selection"
              items={SCOPES.map((scope) => ({
                value: scope.id,
                label: `${scopeNames[scope.id]} · ${idsForScope(scope.id).length} checks`,
              }))}
              onChange={(scope) => {
                s.setScope(scope as Scope);
              }}
              disabled={running}
              className="w-full sm:w-64"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              {custom
                ? "Choose a preset to replace your selection."
                : scope.description}
            </p>
          </div>
          {blocked && (
            <Alert variant="warning" data-tour="qa-inbox">
              <TriangleAlertIcon aria-hidden />
              <AlertTitle>Connect an inbox to test delivery</AlertTitle>
              <AlertDescription>
                <p>Without it, this check will be blocked.</p>
                <div className="mt-3">
                  <QAInboxButton disabled={running} />
                </div>
              </AlertDescription>
            </Alert>
          )}
          <div>
            <div className="flex items-center justify-between gap-3 border-b pb-3 text-xs text-muted-foreground">
              <span>Checklist</span>
              <Button
                variant="ghost"
                size="sm"
                disabled={running}
                onClick={() => setShowAll(!showAll)}
              >
                {showAll
                  ? "Show suggested checks"
                  : `Edit all ${CHECKS.length} checks`}
              </Button>
            </div>
            <ul className="flex flex-col divide-y">
              {visible.map((check) => (
                <li key={check.id} className="flex items-center gap-3 py-3">
                  <Checkbox
                    id={`check-${check.id}`}
                    checked={s.selected.includes(check.id)}
                    disabled={running}
                    onCheckedChange={() => s.toggleCheck(check.id)}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Label
                      htmlFor={`check-${check.id}`}
                      className="cursor-pointer font-normal leading-5"
                    >
                      {check.title}
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`View details for ${check.title}`}
                    onClick={() => setInspect(check)}
                  >
                    <ChevronRightIcon aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          <Accordion data-tour="qa-coverage-limits" className="border-t">
            <AccordionItem value="coverage">
              <AccordionTrigger>
                <span>Coverage details</span>
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {omitted.length} not selected
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-xs font-medium text-muted-foreground">
                      Not selected
                    </h3>
                    {omitted.length ? (
                      <ul className="flex flex-col gap-2 text-sm">
                        {omitted.map((check) => (
                          <li key={check.id}>{check.title}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>All 11 checks selected.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs font-medium text-muted-foreground">
                      Outside this checklist
                    </h3>
                    <ul className="flex flex-col gap-2">
                      <li>Real payments and production email</li>
                      <li>Browsers other than Chrome</li>
                      <li>A full security review</li>
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground">
                      A passing run verifies only the selected checks.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
      <Separator />
      <footer className="shrink-0 bg-background py-4" data-tour="qa-run">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6">
          <div className="flex flex-col gap-1">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="whitespace-nowrap font-medium tabular-nums">
                {s.selected.length} checks selected
              </span>
              <span aria-hidden className="text-muted-foreground">
                ·
              </span>
              <span className="whitespace-nowrap tabular-nums">
                {s.selected.length
                  ? `About ${estimatedMinutes(s.selected)} min`
                  : "0 min"}
              </span>
              <span aria-hidden className="text-muted-foreground">
                ·
              </span>
              <span className="whitespace-nowrap tabular-nums">
                {money(estimatedCost(s.selected))} est.
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              <span>
                Guest · {mobile ? "Desktop + mobile" : "Desktop Chrome"}
              </span>
              <Button
                variant="ghost"
                size="xs"
                disabled={running}
                onClick={() => setSetup(true)}
              >
                Environment
              </Button>
            </div>
          </div>
          <Button disabled={running || !s.selected.length} onClick={onRun}>
            {running ? (
              <Loader2Icon aria-hidden className="motion-safe:animate-spin" />
            ) : (
              <PlayIcon aria-hidden data-icon="inline-start" />
            )}
            {running ? "Running checks…" : `Run ${s.selected.length} checks`}
          </Button>
        </div>
      </footer>
      <QADetails
        open={Boolean(inspect)}
        onOpenChange={(open) => {
          if (!open) setInspect(null);
        }}
        title={inspect?.title ?? "Check details"}
        description={
          inspect ? `${inspect.id} · ${inspect.runner} · ${inspect.device}` : ""
        }
      >
        {inspect && (
          <>
            <Badge variant="secondary">{inspect.area}</Badge>
            <CheckDefinition
              steps={inspect.steps}
              expected={inspect.expected}
              reason={
                inspect.affected
                  ? "The contact form changed in this build."
                  : "Protects a critical buying journey outside the changed code."
              }
            />
            <Separator />
            <p className="text-xs text-muted-foreground">
              Expected behavior comes from the agreed requirements, not the
              current implementation.
            </p>
          </>
        )}
      </QADetails>
      <QADetails
        open={setup}
        onOpenChange={setSetup}
        title="Run environment"
        description={`Forme ecommerce · build ${s.build} · staging`}
      >
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
          <dt className="text-muted-foreground">Build</dt>
          <dd>{s.build}</dd>
          <dt className="text-muted-foreground">Role</dt>
          <dd>Guest shopper</dd>
          <dt className="text-muted-foreground">Browser</dt>
          <dd>Desktop Chrome</dd>
          <dt className="text-muted-foreground">Mobile</dt>
          <dd>{mobile ? "390 × 844 viewport" : "Not selected"}</dd>
          <dt className="text-muted-foreground">Account</dt>
          <dd>Local demo shopper</dd>
          <dt className="text-muted-foreground">Test inbox</dt>
          <dd>{s.inbox ? "Connected" : "Not configured"}</dd>
          <dt className="text-muted-foreground">AI estimate</dt>
          <dd>Includes retries</dd>
        </dl>
        <Separator />
        <p className="text-sm leading-6 text-muted-foreground">
          Inbox delivery cannot be verified until a demo inbox is connected.
          This setup is simulated; no external account is used.
        </p>
        <QAInboxButton disabled={running} />
      </QADetails>
    </div>
  );
}
