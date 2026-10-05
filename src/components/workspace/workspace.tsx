"use client";

import { ArrowLeftIcon, CheckIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { StatusBadge } from "@/components/task-meta";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TASK_BY_ID } from "@/lib/demo/tasks";
import type { Task } from "@/lib/demo/types";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChatPane } from "./chat-pane";
import { AskPane } from "./panes/ask-pane";
import { CodePane } from "./panes/code-pane";
import { EmailPane } from "./panes/email-pane";
import { FigmaPane } from "./panes/figma-pane";
import { SlackPane } from "./panes/slack-pane";
import { ThreeStrandsPane } from "./panes/three-strands-pane";

const ASK_TASK: Task = {
  id: "ask",
  kind: "ad-hoc",
  title: "Ask CockpitOS",
  summary: "",
  app: "slack",
  requester: "You",
  status: "needs-review",
  statusDetail: "Ad-hoc question",
  prepared: [],
  due: "Today",
  autonomy: "Answers only. Nothing is changed or sent.",
};

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
    case "figma-design":
      return <FigmaPane taskId={task.id} />;
    case "prd-prototype":
      return <ThreeStrandsPane taskId={task.id} />;
    default:
      return <AskPane />;
  }
}

export function Workspace({ taskId, query: q }: { taskId: string; query?: string }) {
  const task = TASK_BY_ID[taskId] ?? ASK_TASK;
  const done = useCockpit((s) => Boolean(s.completed[task.id]));
  const toggle = useCockpit((s) => s.toggleCompleted);
  const isDesktop = useIsDesktop();
  const status = done ? "done" : task.status;

  const chat = <ChatPane taskId={task.id} query={q} />;
  const pane = <Pane task={task} />;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2.5 sm:px-6">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href="/" aria-label="Back to Today" />}>
          <ArrowLeftIcon aria-hidden />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">{task.title}</h1>
          <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <ShieldCheckIcon className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{task.autonomy}</span>
          </p>
        </div>
        <StatusBadge status={status} label={done ? "Done" : task.statusDetail} className="hidden max-w-xs sm:inline-flex" />
        {task.kind !== "ad-hoc" && (
          <Button
            size="sm"
            variant={done ? "secondary" : "outline"}
            aria-pressed={done}
            onClick={() => toggle(task.id, !done)}
          >
            <CheckIcon aria-hidden /> {done ? "Done" : "Mark done"}
          </Button>
        )}
      </div>

      {isDesktop ? (
        <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
          <ResizablePanel defaultSize="38%" minSize="28%" maxSize="55%" className="min-w-0">
            {chat}
          </ResizablePanel>
          <ResizableHandle withHandle aria-label="Resize chat and workspace panels" />
          <ResizablePanel defaultSize="62%" minSize="35%" className="flex min-w-0 flex-col">
            {pane}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <MobileLayout chat={chat} pane={pane} />
      )}
    </div>
  );
}

function MobileLayout({ chat, pane }: { chat: React.ReactNode; pane: React.ReactNode }) {
  return (
    <Tabs defaultValue="chat" className="min-h-0 flex-1 gap-0">
      <div className="border-b px-4 py-2">
        <TabsList className="w-full" aria-label="Workspace view">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="work">Prepared work</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="chat" keepMounted className={cn("min-h-0 flex-1 data-[hidden]:hidden")}>
        {chat}
      </TabsContent>
      <TabsContent value="work" className="flex min-h-0 flex-1 flex-col">
        {pane}
      </TabsContent>
    </Tabs>
  );
}
