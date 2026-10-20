"use client";

import { type ReactNode } from "react";
import {
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ConversationEmptyState } from "@/components/ai-elements/conversation";
import type { Outcome } from "@/lib/qa/model";

export const money = (value: number) => `$${value.toFixed(2)}`;
export type EvidenceStatus = Outcome | "stale" | "not-tested";
const labels: Record<EvidenceStatus, string> = {
  passed: "Passed",
  failed: "Failed",
  blocked: "Blocked",
  flaky: "Flaky",
  stale: "Stale",
  "not-tested": "Not tested",
};
export function QAStatus({ status }: { status: EvidenceStatus }) {
  const Icon =
    status === "passed"
      ? CheckCircle2Icon
      : status === "failed"
        ? CircleXIcon
        : status === "stale" || status === "not-tested"
          ? CircleDashedIcon
          : TriangleAlertIcon;
  return (
    <Badge
      variant={
        status === "failed"
          ? "destructive"
          : status === "passed"
            ? "default"
            : "secondary"
      }
    >
      <Icon aria-hidden data-icon="inline-start" />
      {labels[status]}
    </Badge>
  );
}
export function QASelect({
  label,
  value,
  items,
  onChange,
  disabled,
  className,
}: {
  label: string;
  value: string;
  items: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(value) => {
        if (value !== null) onChange(value);
      }}
      disabled={disabled}
    >
      <SelectTrigger aria-label={label} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
export function QADetails({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:w-full sm:max-w-xl">
        <SheetHeader className="pr-14">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-6 pb-6">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
export function QAEmpty({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <ConversationEmptyState
      className="min-h-72"
      title={title}
      description={description}
      icon={<CircleDashedIcon aria-hidden className="size-6" />}
    >
      <div className="flex max-w-md flex-col items-center gap-3">
        <CircleDashedIcon
          aria-hidden
          className="mb-1 size-6 text-muted-foreground"
        />
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        <Button variant="outline" onClick={onAction}>
          {action}
        </Button>
      </div>
    </ConversationEmptyState>
  );
}
export function QASection({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {detail && (
          <span className="text-xs text-muted-foreground">{detail}</span>
        )}
      </div>
      {children}
    </section>
  );
}
export function CheckDefinition({
  steps,
  expected,
  reason,
}: {
  steps: string;
  expected: string;
  reason?: string;
}) {
  return (
    <dl className="flex flex-col gap-5 text-sm leading-6">
      <div>
        <dt className="mb-1 text-xs text-muted-foreground">Steps</dt>
        <dd>{steps}</dd>
      </div>
      <div>
        <dt className="mb-1 text-xs text-muted-foreground">Expected result</dt>
        <dd>{expected}</dd>
      </div>
      {reason && (
        <div>
          <dt className="mb-1 text-xs text-muted-foreground">
            Why it’s included
          </dt>
          <dd>{reason}</dd>
        </div>
      )}
    </dl>
  );
}
