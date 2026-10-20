"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleXIcon,
  Loader2Icon,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Outcome } from "@/lib/qa/model";
import { useQA } from "@/lib/qa/store";

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
          : status === "blocked"
            ? "warning"
            : status === "flaky"
              ? "info"
              : "secondary"
      }
    >
      <Icon aria-hidden data-icon="inline-start" />
      {labels[status]}
    </Badge>
  );
}
export function QASelect({
  id,
  placeholder,
  label,
  value,
  items,
  onChange,
  disabled,
  className,
}: {
  id?: string;
  placeholder?: string;
  label: string;
  value: string | null;
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
      <SelectTrigger id={id} aria-label={label} className={className}>
        <SelectValue placeholder={placeholder} />
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
        <DialogHeader className="pr-8">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex min-w-0 flex-col gap-6">{children}</div>
      </DialogContent>
    </Dialog>
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
    <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-6 py-6">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      <Button className="mt-2" onClick={onAction}>
        {action}
      </Button>
    </div>
  );
}

export function QAInboxButton({ disabled = false }: { disabled?: boolean }) {
  const inbox = useQA((s) => s.inbox);
  const [connecting, setConnecting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || inbox || connecting}
      onClick={() => {
        setConnecting(true);
        timer.current = setTimeout(() => {
          useQA.getState().configureInbox();
          setConnecting(false);
          toast.success("Test inbox connected", {
            description: "Run the delivery check again to verify it.",
          });
        }, 650);
      }}
    >
      {connecting && (
        <Loader2Icon aria-hidden className="motion-safe:animate-spin" />
      )}
      {inbox
        ? "Inbox connected"
        : connecting
          ? "Connecting…"
          : "Connect test inbox"}
    </Button>
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
