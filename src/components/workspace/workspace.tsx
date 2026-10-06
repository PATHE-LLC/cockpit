"use client";

import { CheckIcon, MoreHorizontalIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import type { Task } from "@/lib/demo/types";
import { playCue } from "@/lib/sounds";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChatPane } from "./chat-pane";
import { AskPane } from "./panes/ask-pane";
import { CodePane } from "./panes/code-pane";
import { EmailPane } from "./panes/email-pane";
import { SlackPane } from "./panes/slack-pane";
import { ThreeStrandsPane } from "./panes/three-strands-pane";

const ASK_TASK: Task = {
  id: "ask",
  kind: "ad-hoc",
  title: "Ask",
  summary: "",
  app: "slack",
  requester: "You",
  status: "needs-review",
  statusDetail: "Ask",
  prepared: [],
  due: "Today",
  autonomy: "Answers only.",
};

const INTAKE_TASK: Task = {
  id: "intake",
  kind: "ad-hoc",
  title: "New task",
  summary: "",
  app: "meeting",
  requester: "You",
  status: "needs-review",
  statusDetail: "New",
  prepared: [],
  due: "Soon",
  autonomy: "Nothing is created until you answer.",
  origin: "yours",
};

const SPECIAL: Record<string, Task> = { ask: ASK_TASK, intake: INTAKE_TASK };

const query = "(min-width: 1024px)";
const subscribe = (cb: () => void) => {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};
const useIsDesktop = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true);

function Pane({ task }: { task: Task }) {
  switch (task.kind) {
    case "slack-reply":
      return <SlackPane taskId={task.id} />;
    case "email-draft":
      return <EmailPane taskId={task.id} />;
    case "code-change":
      return <CodePane taskId={task.id} />;
    case "prd-prototype":
      return <ThreeStrandsPane taskId={task.id} />;
    default:
      return <AskPane />;
  }
}

function TaskHeader({ task, open }: { task: Task; open: boolean }) {
  const done = useCockpit((s) => Boolean(s.completed[task.id]));
  const discarded = useCockpit((s) => Boolean(s.discarded[task.id]));
  const toggle = useCockpit((s) => s.toggleCompleted);
  const discard = useCockpit((s) => s.discardTask);
  const restore = useCockpit((s) => s.restoreTask);
  const remove = useCockpit((s) => s.deleteTask);
  const openTaskForm = useCockpit((s) => s.openTaskForm);
  const router = useRouter();

  return (
    <div className={cn("flex flex-col gap-2 py-2", open && "px-6")}>
        <div className="flex items-center gap-2">
          <h1 className="min-w-0 flex-1 truncate text-sm font-medium">{task.title}</h1>
          <div className="flex shrink-0 items-center gap-1" data-tour="task-actions">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-sm" aria-label="More actions" />}
              >
                <MoreHorizontalIcon aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openTaskForm(task.id)}>Edit</DropdownMenuItem>
                {discarded ? (
                  <DropdownMenuItem
                    onClick={() => {
                      restore(task.id);
                      playCue("restore");
                    }}
                  >
                    Restore
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      discard(task.id);
                      playCue("discard");
                    }}
                  >
                    Archive
                  </DropdownMenuItem>
                )}
                {discarded ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        remove(task.id);
                        router.push("/tasks?archive=1");
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant={done ? "secondary" : "outline"}
              aria-pressed={done}
              onClick={() => {
                const next = !done;
                toggle(task.id, next);
                if (next) playCue("done");
              }}
            >
              <CheckIcon aria-hidden /> {done ? "Done" : "Mark done"}
            </Button>
          </div>
        </div>
    </div>
  );
}

export function Workspace({ taskId, query: q }: { taskId: string; query?: string }) {
  const stored = useCockpit((s) => s.tasks.find((task) => task.id === taskId));
  const task = stored ?? SPECIAL[taskId];
  const open = useCockpit((s) => Boolean(s.open[task?.id ?? ""]) && task?.kind !== "figma-design");
  const close = useCockpit((s) => s.closeArtifact);
  const isDesktop = useIsDesktop();

  if (!task) {
    return (
      <div className="page-column min-h-0 flex-1 items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-lg font-semibold">That task is gone</h1>
        <p className="text-sm text-muted-foreground">It was deleted from this session.</p>
        <Button nativeButton={false} render={<Link href="/tasks" />}>
          All tasks
        </Button>
      </div>
    );
  }

  const chat = <ChatPane taskId={task.id} query={q} flush={!open} />;
  const artifact = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-center border-b px-2 py-1">
        <Button variant="ghost" size="sm" onClick={() => close(task.id)}>
          <XIcon aria-hidden /> Close
        </Button>
      </div>
      <Pane task={task} />
    </div>
  );

  const header = task.id === "ask" || task.id === "intake" ? null : <TaskHeader task={task} open={open} />;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      {!open ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {header ? <div className="page-column">{header}</div> : null}
          {chat}
        </div>
      ) : isDesktop ? (
        <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
          <ResizablePanel defaultSize="42%" minSize="28%" maxSize="60%" className="min-w-0">
            <div className="flex h-full min-h-0 flex-col">
              {header}
              {chat}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle aria-label="Resize panels" />
          <ResizablePanel defaultSize="58%" minSize="32%" className="flex min-w-0 flex-col">
            {artifact}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        artifact
      )}
    </div>
  );
}
