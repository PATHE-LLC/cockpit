"use client";

import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { ExternalLinkIcon, FileTextIcon, GitBranchIcon, GitPullRequestIcon, HistoryIcon, PenToolIcon } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  ALYSSA_THREAD,
  FIGMA_FILE_URL,
  FEASIBILITY,
  GLENN_THREAD,
  RLS_CITATIONS,
  RLS_MIGRATION_SQL,
  WIX_CITATIONS,
} from "@/lib/demo/content";
import { STATUS_LABEL } from "@/lib/demo/tasks";
import { useCockpit } from "@/lib/store";
import {
  CodeReplyCard,
  DraftFrame,
  EmailDraftCard,
  EmailQuestionsCard,
  SlackDraftCard,
} from "./draft-cards";
import { CodeBlock, CodeBlockCopyButton } from "@/components/ai-elements/code-block";
import { ResponseSection } from "./response-section";

type SourcePill = { label: string; href: string; kind: "doc" | "github" };

const SOURCE_PILLS: Record<string, SourcePill[]> = {
  "glenn-supabase-rls": [
    { label: "Bypassing RLS", href: RLS_CITATIONS[0].url, kind: "doc" },
    { label: "RLS performance", href: RLS_CITATIONS[1].url, kind: "doc" },
    { label: "CREATE POLICY", href: RLS_CITATIONS[2].url, kind: "doc" },
    { label: "nightly-reconcile", href: RLS_CITATIONS[3].url, kind: "github" },
  ],
  "alyssa-wix-quotes": [
    { label: "Alyssa's email", href: "#alyssa-thread", kind: "doc" },
    { label: "Price quotes", href: WIX_CITATIONS[0].url, kind: "doc" },
    { label: "Wix Forms", href: WIX_CITATIONS[1].url, kind: "doc" },
    { label: "Velo", href: WIX_CITATIONS[2].url, kind: "doc" },
  ],
};

const PANE_ACTIONS: Record<string, { label: string; pane?: string; href?: string; external?: "github" }[]> = {
  "model-6d-self-service": [
    { label: "View PR", pane: "diff" },
    { label: "Open GitHub", external: "github" },
  ],
  "recall-translation-figma": [{ label: "Open Figma", href: FIGMA_FILE_URL }],
};

function PaneActions({ task }: { task: string }) {
  const openArtifact = useCockpit((s) => s.openArtifact);
  const actions = PANE_ACTIONS[task] ?? [];
  if (!actions.length) return null;
  return (
    <div className="my-2 flex flex-wrap gap-2" data-tour="pr-actions">
      {actions.map((action) =>
        action.href ? (
          <Button
            key={action.label}
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<a href={action.href} target="_blank" rel="noreferrer" />}
          >
            <ExternalLinkIcon aria-hidden /> {action.label}
          </Button>
        ) : action.pane ? (
          <Button key={action.label} size="sm" variant="outline" onClick={() => openArtifact(task, action.pane)}>
            {action.label}
          </Button>
        ) : (
          <Button
            key={action.label}
            size="sm"
            variant="outline"
            onClick={() => toast("Opening GitHub", { description: "acme/model-6d" })}
          >
            <ExternalLinkIcon aria-hidden /> {action.label}
          </Button>
        ),
      )}
    </div>
  );
}

function SourcePills({ task }: { task: string }) {
  const pills = SOURCE_PILLS[task] ?? [];
  if (!pills.length) return null;
  return (
    <div className="my-2 flex flex-wrap gap-1.5">
      {pills.map((pill) => {
        const Icon = pill.kind === "github" ? GitPullRequestIcon : FileTextIcon;
        const external = pill.href.startsWith("http");
        return (
          <a
            key={pill.label}
            href={pill.href}
            {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
            className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Icon className="size-3.5 text-muted-foreground" aria-hidden />
            {pill.label}
          </a>
        );
      })}
    </div>
  );
}

function InlineThread({ task }: { task: string }) {
  if (task === "glenn-supabase-rls") {
    return (
      <ResponseSection title="Thread">
        <p className="text-xs text-muted-foreground">
          {GLENN_THREAD.channel} · {GLENN_THREAD.time}
        </p>
        <p className="mt-1 text-sm font-medium">{GLENN_THREAD.author}</p>
        <p className="mt-1 text-sm leading-relaxed">{GLENN_THREAD.message}</p>
      </ResponseSection>
    );
  }
  if (task === "alyssa-wix-quotes") {
    return (
      <ResponseSection title="Thread">
        <div id="alyssa-thread">
          <p className="text-xs text-muted-foreground">
            {ALYSSA_THREAD.from} · {ALYSSA_THREAD.time}
          </p>
          <p className="mt-1 text-sm font-medium">{ALYSSA_THREAD.subject}</p>
          <p className="mt-1 text-sm leading-relaxed">{ALYSSA_THREAD.message}</p>
        </div>
      </ResponseSection>
    );
  }
  return null;
}

function FeasibilitySection() {
  return (
    <ResponseSection title="Feasibility">
      <ul className="flex flex-col gap-2 text-sm">
        {FEASIBILITY.map((row) => (
          <li key={row.requirement} className="flex items-baseline justify-between gap-3">
            <span>{row.requirement}</span>
            <span className="shrink-0 text-muted-foreground capitalize">{row.verdict}</span>
          </li>
        ))}
      </ul>
    </ResponseSection>
  );
}

function MigrationSection() {
  return (
    <ResponseSection title="Migration">
      <CodeBlock code={RLS_MIGRATION_SQL} language="sql">
        <CodeBlockCopyButton />
      </CodeBlock>
    </ResponseSection>
  );
}

function FigmaFramesSection() {
  const frames = useCockpit((s) => s.figma.frames);
  return (
    <ResponseSection title="Frames">
      <ul className="flex flex-col gap-1 py-1 text-sm">
        {frames.map((frame) => (
          <li key={frame.id}>{frame.name}</li>
        ))}
      </ul>
    </ResponseSection>
  );
}

function CodeApprovalCard() {
  const approval = useCockpit((s) => s.code.approval);
  const setApproval = useCockpit((s) => s.setApproval);
  const state = approval === "pending" ? "approval-requested" : "approval-responded";
  const decision =
    approval === "pending"
      ? { id: "push" }
      : { id: "push", approved: approval === "approved" };

  return (
    <Confirmation approval={decision} state={state} className="my-3 rounded-none border-0 bg-transparent px-0 py-1 shadow-none">
      <ConfirmationTitle>
        <ConfirmationRequest>
          <span className="font-medium">Open a draft PR?</span>{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">cursor/model-6d-self-service-form</code>
        </ConfirmationRequest>
        <ConfirmationAccepted>
          <span className="flex items-center gap-2">
            <GitBranchIcon className="size-4 text-brand" aria-hidden />
            Draft PR #214
          </span>
        </ConfirmationAccepted>
        <ConfirmationRejected>Kept in the sandbox.</ConfirmationRejected>
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
          Approve
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
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<a href={FIGMA_FILE_URL} target="_blank" rel="noreferrer" />}
        >
          <ExternalLinkIcon aria-hidden /> Open Figma
        </Button>
      </div>
    </DraftFrame>
  );
}

function PrototypeVersionCard({ version, label, restored }: { version: number; label?: string; restored?: boolean }) {
  const current = useCockpit((s) => s.prototype.current);
  const versions = useCockpit((s) => s.prototype.versions);
  const restore = useCockpit((s) => s.restorePrototypeVersion);
  const openArtifact = useCockpit((s) => s.openArtifact);
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
        <Button size="sm" variant="outline" onClick={() => openArtifact("three-strands-dashboard", "prototype")}>
          View prototype
        </Button>
        <Button size="sm" variant="outline" onClick={() => openArtifact("three-strands-dashboard", "prd")}>
          View doc
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
  const tasks = useCockpit((s) => s.tasks);
  const completed = useCockpit((s) => s.completed);
  const discarded = useCockpit((s) => s.discarded);
  const visible = tasks.filter((task) => !discarded[task.id]);
  return (
    <ul className="my-2 flex flex-col">
      {visible.map((task) => (
        <li key={task.id}>
          <Link
            href={`/tasks/${task.id}`}
            className="flex items-baseline justify-between gap-3 rounded-xl px-2 py-2 text-sm outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent"
          >
            <span className="min-w-0 truncate">{task.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {completed[task.id] ? "Done" : STATUS_LABEL[task.status]}
            </span>
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
      return (
        <ResponseSection title="Reply">
          <SlackDraftCard rev={Number(a.rev ?? 0)} flat />
        </ResponseSection>
      );
    case "email_draft":
      return (
        <ResponseSection title="Draft">
          <EmailDraftCard rev={Number(a.rev ?? 0)} flat />
        </ResponseSection>
      );
    case "email_questions":
      return <EmailQuestionsCard />;
    case "code_approval":
      return <CodeApprovalCard />;
    case "code_reply":
      return (
        <ResponseSection title="Reply">
          <CodeReplyCard rev={Number(a.rev ?? 0)} flat />
        </ResponseSection>
      );
    case "figma_frames":
      return <FigmaFramesSection />;
    case "pane_actions":
      return <PaneActions task={String(a.task ?? "")} />;
    case "source_pills":
      return <SourcePills task={String(a.task ?? "")} />;
    case "inline_thread":
      return <InlineThread task={String(a.task ?? "")} />;
    case "feasibility":
      return <FeasibilitySection />;
    case "migration_sql":
      return <MigrationSection />;
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
