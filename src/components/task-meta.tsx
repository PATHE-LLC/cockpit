import {
  CheckCircle2Icon,
  GitPullRequestIcon,
  HandIcon,
  MailIcon,
  MessageSquareIcon,
  PenToolIcon,
  PresentationIcon,
  SparklesIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/lib/demo/tasks";
import type { SourceApp, Task, TaskStatus } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

export const APP_META: Record<SourceApp, { label: string; icon: LucideIcon }> = {
  slack: { label: "Slack", icon: MessageSquareIcon },
  email: { label: "Email", icon: MailIcon },
  asana: { label: "Asana", icon: CheckCircle2Icon },
  meeting: { label: "Meeting notes", icon: PresentationIcon },
  figma: { label: "Figma", icon: PenToolIcon },
  github: { label: "GitHub", icon: GitPullRequestIcon },
};

const STATUS_ICON: Record<TaskStatus, LucideIcon> = {
  "needs-review": SparklesIcon,
  "needs-input": HandIcon,
  "awaiting-approval": GitPullRequestIcon,
  collaborating: UsersIcon,
  iterating: PresentationIcon,
  done: CheckCircle2Icon,
};

const STATUS_STYLE: Record<TaskStatus, string> = {
  "needs-review": "border-brand/25 bg-brand-soft text-brand",
  "needs-input": "border-warn/40 bg-warn-soft text-foreground",
  "awaiting-approval": "border-warn/40 bg-warn-soft text-foreground",
  collaborating: "border-border bg-secondary text-secondary-foreground",
  iterating: "border-brand/25 bg-brand-soft text-brand",
  done: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({
  status,
  className,
  label,
}: {
  status: TaskStatus;
  className?: string;
  label?: string;
}) {
  const Icon = STATUS_ICON[status];
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", STATUS_STYLE[status], className)}>
      <Icon className="size-3" aria-hidden />
      {label ?? STATUS_LABEL[status]}
    </Badge>
  );
}

export function AppChip({ task }: { task: Task }) {
  const { icon: Icon, label } = APP_META[task.app];
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}
