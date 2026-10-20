"use client";

import { Fragment, useState } from "react";
import {
  BotIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  Code2Icon,
  MonitorIcon,
  PlayIcon,
  SmartphoneIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import { QASelect, QADetails, CheckDefinition, money } from "./qa-shared";

const scopeNames: Record<Scope, string> = {
  changed: "Changed + critical",
  risk: "Risk-based",
  release: "Release pass",
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
  const hidden = CHECKS.length - visible.length;
  const omitted = CHECKS.filter((check) => !s.selected.includes(check.id));
  const blocked = s.selected.includes("C03") && !s.inbox;
  const allVisible = visible.every((check) => s.selected.includes(check.id));
  const mobile = s.selected.some(
    (id) => CHECKS.find((check) => check.id === id)?.device === "Mobile",
  );
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Choose what to test
            </h1>
            <p className="text-sm text-muted-foreground">
              The contact form changed. Check it, and keep the buying journey
              covered.
            </p>
          </div>
          <fieldset disabled={running} className="flex min-w-0 flex-col gap-3">
            <legend className="mb-3 text-sm font-medium">Coverage</legend>
            <ToggleGroup
              value={[s.scope]}
              onValueChange={(values) => {
                const scope = SCOPES.find((item) => item.id === values[0]);
                if (scope) s.setScope(scope.id);
              }}
              variant="outline"
              spacing={0}
              aria-label="Coverage"
              className="hidden sm:flex"
            >
              {SCOPES.map((scope) => (
                <ToggleGroupItem value={scope.id} key={scope.id}>
                  {scopeNames[scope.id]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <div className="sm:hidden">
              <QASelect
                label="Coverage"
                value={s.scope}
                items={SCOPES.map((scope) => ({
                  value: scope.id,
                  label: scopeNames[scope.id],
                }))}
                onChange={(scope) => s.setScope(scope as Scope)}
                disabled={running}
                className="w-full"
              />
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {scope.description}
            </p>
          </fieldset>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              {blocked ? (
                <TriangleAlertIcon aria-hidden className="size-3.5" />
              ) : (
                <CheckIcon aria-hidden className="size-3.5" />
              )}
              {blocked
                ? "Inbox not connected"
                : s.inbox
                  ? "Demo inbox connected"
                  : "Guest shopper · no external account required"}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={running}
              onClick={() => setSetup(true)}
            >
              {blocked ? "Set up inbox" : "Run environment"}
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      aria-label={
                        allVisible
                          ? "Deselect visible checks"
                          : "Select visible checks"
                      }
                      checked={allVisible}
                      indeterminate={
                        !allVisible &&
                        visible.some((check) => s.selected.includes(check.id))
                      }
                      disabled={running}
                      onCheckedChange={() =>
                        visible.forEach((check) => {
                          if (s.selected.includes(check.id) === allVisible)
                            s.toggleCheck(check.id);
                        })
                      }
                    />
                  </TableHead>
                  <TableHead>
                    Check{" "}
                    <span className="ml-1 text-muted-foreground">
                      {s.selected.length}/{CHECKS.length}
                    </span>
                  </TableHead>
                  <TableHead className="hidden w-32 md:table-cell">
                    Method
                  </TableHead>
                  <TableHead className="hidden w-28 lg:table-cell">
                    Device
                  </TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Check details</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((check, index) => (
                  <Fragment key={check.id}>
                    {(index === 0 ||
                      visible[index - 1].area !== check.area) && (
                      <TableRow className="bg-muted/40">
                        <TableCell colSpan={5} className="py-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {check.area}
                          </span>
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell>
                        <Checkbox
                          id={`check-${check.id}`}
                          checked={s.selected.includes(check.id)}
                          disabled={running}
                          onCheckedChange={() => s.toggleCheck(check.id)}
                        />
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <Label
                          htmlFor={`check-${check.id}`}
                          className="cursor-pointer font-normal leading-5"
                        >
                          {check.title}
                        </Label>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          {check.runner === "AI browser" ? (
                            <BotIcon aria-hidden className="size-3.5" />
                          ) : (
                            <Code2Icon aria-hidden className="size-3.5" />
                          )}
                          {check.runner === "AI browser"
                            ? "AI-assisted"
                            : "Coded"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          {check.device === "Mobile" ? (
                            <SmartphoneIcon aria-hidden className="size-3.5" />
                          ) : (
                            <MonitorIcon aria-hidden className="size-3.5" />
                          )}
                          {check.device}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`View details for ${check.title}`}
                          onClick={() => setInspect(check)}
                        >
                          <ChevronRightIcon aria-hidden />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                ))}
              </TableBody>
            </Table>
            {hidden > 0 && (
              <div className="flex justify-center border-t px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={running}
                  onClick={() => setShowAll(true)}
                >
                  Show {hidden} more checks
                </Button>
              </div>
            )}
            {showAll && s.scope !== "release" && (
              <div className="flex justify-center border-t px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(false)}
                >
                  Show recommended checks
                </Button>
              </div>
            )}
          </div>
          <Collapsible>
            <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>
              <CircleHelpIcon aria-hidden data-icon="inline-start" />
              {omitted.length} checks excluded · coverage limits
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-col gap-3 py-4 text-xs leading-5 text-muted-foreground">
                {omitted.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {omitted.map((check) => (
                      <li key={check.id}>{check.title}</li>
                    ))}
                  </ul>
                )}
                <p>
                  This agreed checklist excludes real payments, production
                  delivery, other browsers and comprehensive security testing. A
                  passing run only verifies the selected checks.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
      <Separator />
      <footer className="shrink-0 bg-background px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm">
              <span className="font-medium tabular-nums">
                {s.selected.length} checks selected
              </span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="tabular-nums">
                {s.selected.length
                  ? `~${estimatedMinutes(s.selected)} min`
                  : "0 min"}
              </span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="tabular-nums">
                {money(estimatedCost(s.selected))} est.
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Build {s.build} · Guest ·{" "}
              {mobile ? "Desktop + mobile" : "Desktop Chrome"} · estimated AI
              cost includes retries
            </p>
          </div>
          <Button disabled={running || !s.selected.length} onClick={onRun}>
            <PlayIcon aria-hidden data-icon="inline-start" />
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
        </dl>
        <Separator />
        <p className="text-sm leading-6 text-muted-foreground">
          Inbox delivery cannot be verified until a demo inbox is connected.
          This setup is simulated; no external account is used.
        </p>
        <Button disabled={s.inbox || running} onClick={s.configureInbox}>
          {s.inbox ? "Demo inbox connected" : "Connect demo inbox"}
        </Button>
      </QADetails>
    </div>
  );
}
