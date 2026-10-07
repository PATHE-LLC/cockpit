"use client";

import { useAui, useAuiState } from "@assistant-ui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { chatTitle, snapshotThread, threadText, withProjectLookup } from "@/lib/chat/snapshot";
import { namedProject, projectByName } from "@/lib/demo/library";
import { playClick } from "@/lib/sounds";
import { useCockpit } from "@/lib/store";
import { ChatPane } from "./chat-pane";

function PromoteBar({ chatId }: { chatId: string }) {
  const aui = useAui();
  const running = useAuiState((s) => s.thread.isRunning);
  const hasUser = useAuiState((s) => s.thread.messages.some((message) => message.role === "user"));
  const addTask = useCockpit((s) => s.addTask);
  const saveThread = useCockpit((s) => s.saveThread);
  const router = useRouter();

  const add = () => {
    const saved = snapshotThread(aui.thread().getState().messages);
    const projectName = namedProject(threadText(saved));
    const projectId = projectName ? projectByName(projectName)?.id : undefined;
    const firstUser = saved.find((message) => message.role === "user");
    const title = chatTitle(
      !firstUser || typeof firstUser.content === "string"
        ? (firstUser?.content as string | undefined) ?? ""
        : firstUser.content
            .map((part) => (part.type === "text" ? part.text : ""))
            .join(" "),
    );
    saveThread(chatId, projectId ? withProjectLookup(saved, chatId, projectId) : saved);
    addTask({
      id: chatId,
      title,
      summary: title,
      due: "Soon",
      project: projectName ?? "",
    });
    playClick();
    router.replace(`/tasks/${chatId}`);
  };

  return (
    <div className="page-column">
      <div className="flex items-center gap-2 py-2">
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium">Chat</h1>
        <Button size="sm" variant="outline" onClick={add} disabled={running || !hasUser}>
          Add to checklist
        </Button>
      </div>
    </div>
  );
}

export function GeneralChat({ chatId, query }: { chatId: string; query?: string }) {
  const task = useCockpit((s) => s.tasks.find((item) => item.id === chatId));
  const router = useRouter();

  useEffect(() => {
    if (task) router.replace(`/tasks/${chatId}`);
  }, [chatId, router, task]);

  if (task) return null;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <ChatPane taskId={chatId} query={query} flush extra={<PromoteBar chatId={chatId} />} />
    </div>
  );
}
