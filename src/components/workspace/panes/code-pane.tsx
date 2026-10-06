"use client";

import { ExternalLinkIcon } from "lucide-react";
import { toast } from "sonner";
import { MessageResponse } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { DiffViewer } from "@/components/ui/diff-viewer";
import { MODEL_6D_PR, MODEL_6D_PR_PATCH } from "@/lib/demo/content";
import { PaneScroll } from "./shared";

export function CodePane({ taskId }: { taskId: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-tour="pr-pane" data-task={taskId}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2 sm:px-5">
        <p className="text-sm font-medium">Pull request</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast("Opening GitHub", { description: MODEL_6D_PR.repo })}
        >
          <ExternalLinkIcon aria-hidden /> Open on GitHub
        </Button>
      </div>
      <PaneScroll className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{MODEL_6D_PR.title}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="size-2 rounded-full bg-brand" aria-hidden />
              Open
            </span>
            <span className="text-muted-foreground">· Playwright passed</span>
          </p>
        </div>

        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex gap-3">
            <dt className="w-16 shrink-0 text-muted-foreground">Repo</dt>
            <dd className="font-mono text-[13px]">{MODEL_6D_PR.repo}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-16 shrink-0 text-muted-foreground">Commits</dt>
            <dd className="min-w-0 flex-1">
              <ul className="flex flex-col gap-1.5">
                {MODEL_6D_PR.commits.map(([sha, message]) => (
                  <li key={sha} className="flex min-w-0 gap-2">
                    <code className="shrink-0 font-mono text-[13px] text-muted-foreground">{sha}</code>
                    <span className="min-w-0">{message}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>

        <article className="rounded-xl border bg-card px-4 py-3 text-sm leading-relaxed">
          <MessageResponse>{MODEL_6D_PR.description}</MessageResponse>
        </article>

        <div>
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Files</h3>
          <ul className="mt-2 flex flex-col gap-1 font-mono text-[13px]">
            {MODEL_6D_PR.files.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        </div>

        <DiffViewer patch={MODEL_6D_PR_PATCH} showIcon />
      </PaneScroll>
    </div>
  );
}
