"use client";

import { AssistantRuntimeProvider, useAui, useAuiState, useLocalRuntime } from "@assistant-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { createTaskAdapter } from "@/lib/chat/adapter";
import { INITIAL_MESSAGES } from "@/lib/chat/initial";
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
    router.replace(`/tasks/${taskId}`, { scroll: false });
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

export function ChatPane({ taskId, query, flush = false }: { taskId: string; query?: string; flush?: boolean }) {
  const adapter = useMemo(() => createTaskAdapter(taskId), [taskId]);

  useEffect(() => {
    if (taskId !== "intake") return;
    const { intake, setIntake } = useCockpit.getState();
    if (!intake.phase) setIntake({ phase: "what", what: "", who: "" });
  }, [taskId]);

  const runtime = useLocalRuntime(adapter, {
    initialMessages: INITIAL_MESSAGES[taskId] ?? INITIAL_MESSAGES.ask,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-full min-h-0 flex-1 flex-col" data-tour="task-chat">
        <InitialPrompt taskId={taskId} query={query} />
        <IntakeHandoff taskId={taskId} />
        <Thread flush={flush} autoFocus={false} components={{ ToolFallback: ToolRouter, ToolGroup: Passthrough, FollowupSuggestions: NoSuggestions }} />
      </div>
    </AssistantRuntimeProvider>
  );
}
