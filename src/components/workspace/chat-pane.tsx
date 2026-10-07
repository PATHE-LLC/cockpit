"use client";

import { AssistantRuntimeProvider, useAui, useAuiState, useLocalRuntime } from "@assistant-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { createTaskAdapter } from "@/lib/chat/adapter";
import { GENERAL_CHAT_MESSAGES, INITIAL_MESSAGES, TOUR_CHAT_MESSAGES } from "@/lib/chat/initial";
import { newTaskIntent } from "@/lib/chat/responders";
import { useCockpit } from "@/lib/store";
import { ToolRouter } from "./tool-ui";

function InitialPrompt({ taskId, query }: { taskId: string; query: string | undefined }) {
  const aui = useAui();
  const ready = useAuiState((s) => s.thread.isLoading === false);
  const router = useRouter();
  const sent = useRef(false);

  useEffect(() => {
    if (!query || !ready || sent.current) return;
    sent.current = true;
    const next = taskId.startsWith("chat-") ? `/chats/${taskId}` : `/tasks/${taskId}`;
    router.replace(next, { scroll: false });
    if (taskId === "intake" && newTaskIntent(query)?.bare) return;
    aui.thread().append(query);
  }, [aui, query, ready, router, taskId]);

  return null;
}

const Passthrough = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

const NoSuggestions = () => null;

function IntakeHandoff({ taskId }: { taskId: string }) {
  const handoff = useCockpit((s) => s.intakeHandoff);
  const clear = useCockpit((s) => s.clearIntakeHandoff);
  const router = useRouter();

  useEffect(() => {
    if (!handoff || taskId === "intake") return;
    const text = handoff;
    clear();
    router.push(`/tasks/intake?q=${encodeURIComponent(text)}`);
  }, [clear, handoff, router, taskId]);

  return null;
}

export function ChatPane({
  taskId,
  query,
  flush = false,
  extra,
}: {
  taskId: string;
  query?: string;
  flush?: boolean;
  extra?: React.ReactNode;
}) {
  const adapter = useMemo(() => createTaskAdapter(taskId), [taskId]);
  const saved = useCockpit((s) => s.threads[taskId]);
  const initialMessages = useMemo(
    () =>
      saved && saved.length > 0
        ? saved
        : taskId === "chat-tour"
          ? TOUR_CHAT_MESSAGES
          : taskId.startsWith("chat-")
            ? GENERAL_CHAT_MESSAGES
          : (INITIAL_MESSAGES[taskId] ?? INITIAL_MESSAGES.ask),
    [saved, taskId],
  );

  useEffect(() => {
    if (taskId !== "intake") return;
    const { intake, setIntake } = useCockpit.getState();
    if (!intake.phase) setIntake({ phase: "what", what: "", who: "" });
  }, [taskId]);

  const runtime = useLocalRuntime(adapter, { initialMessages });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-full min-h-0 flex-1 flex-col" data-tour="task-chat">
        {extra}
        <InitialPrompt taskId={taskId} query={query} />
        <IntakeHandoff taskId={taskId} />
        <Thread flush={flush} autoFocus={false} components={{ ToolFallback: ToolRouter, ToolGroup: Passthrough, FollowupSuggestions: NoSuggestions }} />
      </div>
    </AssistantRuntimeProvider>
  );
}
