"use client";

import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { ExternalLinkIcon, GitBranchIcon, HistoryIcon, LayersIcon, PenToolIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Checkpoint,
  CheckpointIcon,
} from "@/components/ai-elements/checkpoint";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
import { StatusBadge } from "@/components/task-meta";
import { Button } from "@/components/ui/button";
import { TASKS } from "@/lib/demo/tasks";
import { useCockpit } from "@/lib/store";
import {
  CodeReplyCard,
  DraftFrame,
  EmailDraftCard,
  EmailQuestionsCard,
  SlackDraftCard,
} from "./draft-cards";
import { PREVIEW_PATH, previewQuery } from "./panes/prototype-pane";

function CodeApprovalCard() {
  const approval = useCockpit((s) => s.code.approval);
  const setApproval = useCockpit((s) => s.setApproval);
  const state = approval === "pending" ? "approval-requested" : "approval-responded";
  const decision =
    approval === "pending"
      ? { id: "push" }
      : { id: "push", approved: approval === "approved" };

  return (
    <Confirmation approval={decision} state={state} className="my-3 rounded-2xl">
      <ConfirmationTitle>
        <ConfirmationRequest>
          <span className="font-medium">Push and open a draft PR?</span> Branch{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">cursor/model-6d-self-service-form</code> has 3 new
          files and passes all checks. Nothing leaves the sandbox until you approve.
        </ConfirmationRequest>
        <ConfirmationAccepted>
          <span className="flex items-center gap-2">
            <GitBranchIcon className="size-4 text-brand" aria-hidden />
            Approved. Branch pushed and draft PR #214 opened (simulated).
          </span>
        </ConfirmationAccepted>
        <ConfirmationRejected>
          Kept local. The branch stays in the sandbox and nothing was pushed.
        </ConfirmationRejected>
      </ConfirmationTitle>
      <ConfirmationActions className="self-start">
        <ConfirmationAction
          variant="outline"
          onClick={() => {
            setApproval("rejected");
          }}
        >
          Keep local
        </ConfirmationAction>
        <ConfirmationAction
          onClick={() => {
            setApproval("approved");
            toast.success("Draft PR opened", { description: "Simulated: #214 on acme/model-6d" });
          }}
        >
          Approve push + draft PR
        </ConfirmationAction>
      </ConfirmationActions>
      {approval !== "pending" && (
        <Button
          size="sm"
          variant="ghost"
          className="self-start text-muted-foreground"
          onClick={() => setApproval("pending")}
        >
          Undo decision
        </Button>
      )}
    </Confirmation>
  );
}

function FigmaUpdateCard({ change }: { change: string }) {
  const setPane = useCockpit((s) => s.setPane);
  const frames = useCockpit((s) => s.figma.frames);
  const label =
    change === "frame"
      ? `Canvas now has ${frames.length} frames`
      : change === "lang"
        ? "Language preview updated"
        : change === "srt"
          ? "Export menu updated"
          : "Original-text behaviour updated";
  return (
    <DraftFrame icon={<PenToolIcon className="size-3.5" />} label="Figma canvas" meta="Recall · Translation">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">{label}</p>
        <Button size="sm" variant="outline" onClick={() => setPane("recall-translation-figma", "canvas")}>
          <LayersIcon aria-hidden /> View on canvas
        </Button>
      </div>
    </DraftFrame>
  );
}

function PrototypeVersionCard({ version, label, restored }: { version: number; label?: string; restored?: boolean }) {
  const current = useCockpit((s) => s.prototype.current);
  const versions = useCockpit((s) => s.prototype.versions);
  const restore = useCockpit((s) => s.restorePrototypeVersion);
  const config = useCockpit((s) => s.prototype.config);
  const setPane = useCockpit((s) => s.setPane);
  const info = versions.find((v) => v.version === version);
  const isCurrent = current === version;
  return (
    <div className="my-3">
      <Checkpoint className="text-muted-foreground">
        <CheckpointIcon>
          <HistoryIcon className="size-4 shrink-0" aria-hidden />
        </CheckpointIcon>
        <span className="shrink-0 text-xs font-medium text-foreground">
          v{version}
          {restored ? " restored" : ""}
        </span>
        <span className="truncate text-xs">{label ?? info?.label}</span>
      </Checkpoint>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setPane("three-strands-dashboard", "prototype")}>
          <LayersIcon aria-hidden /> Show preview
        </Button>
        <Button size="sm" variant="outline" nativeButton={false} render={<a href={`${PREVIEW_PATH}?${previewQuery(config, current)}`} target="_blank" rel="noreferrer" />}>
          <ExternalLinkIcon aria-hidden /> Open live
        </Button>
        {!isCurrent && (
          <Button size="sm" variant="ghost" onClick={() => restore(version)}>
            Restore v{version}
          </Button>
        )}
      </div>
    </div>
  );
}

function TaskLinksCard() {
  const completed = useCockpit((s) => s.completed);
  return (
    <ul className="my-3 divide-y rounded-2xl border bg-card">
      {TASKS.map((t) => (
        <li key={t.id}>
          <Link
            href={`/tasks/${t.id}`}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent"
          >
            <span className="min-w-0 truncate">{t.title}</span>
            <StatusBadge status={completed[t.id] ? "done" : t.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export const ToolRouter: ToolCallMessagePartComponent = ({ toolName, args }) => {
  const a = (args ?? {}) as Record<string, string | number | boolean>;
  switch (toolName) {
    case "slack_draft":
      return <SlackDraftCard rev={Number(a.rev ?? 0)} />;
    case "email_draft":
      return <EmailDraftCard rev={Number(a.rev ?? 0)} />;
    case "email_questions":
      return <EmailQuestionsCard />;
    case "code_approval":
      return <CodeApprovalCard />;
    case "code_reply":
      return <CodeReplyCard rev={Number(a.rev ?? 0)} />;
    case "figma_update":
      return <FigmaUpdateCard change={String(a.change ?? "")} />;
    case "prototype_version":
      return (
        <PrototypeVersionCard
          version={Number(a.version ?? 0)}
          label={a.label ? String(a.label) : undefined}
          restored={Boolean(a.restored)}
        />
      );
    case "task_links":
      return <TaskLinksCard />;
    default:
      return null;
  }
};
