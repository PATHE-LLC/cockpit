"use client";

import { AssistantRuntimeProvider, useAui, useAuiState, useLocalRuntime } from "@assistant-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { createTaskAdapter } from "@/lib/chat/adapter";
import { INITIAL_MESSAGES } from "@/lib/chat/initial";
import { SUGGESTIONS } from "@/lib/chat/suggestions";
import { ToolRouter } from "./tool-ui";

function InitialPrompt({ taskId, query }: { taskId: string; query: string | undefined }) {
  const aui = useAui();
  const router = useRouter();
  const sent = useRef(false);

  useEffect(() => {
    if (!query || sent.current) return;
    sent.current = true;
    router.replace(`/tasks/${taskId}`, { scroll: false });
    aui.thread().append(query);
  }, [aui, query, router, taskId]);

  return null;
}

function QuickActions({ prompts }: { prompts: string[] }) {
  const aui = useAui();
  const running = useAuiState((s) => s.thread.isRunning);
  if (running) return null;
  return (
    <Suggestions aria-label="Suggested replies" className="px-0.5">
      {prompts.map((p) => (
        <Suggestion key={p} suggestion={p} onClick={(text) => aui.thread().append(text)} />
      ))}
    </Suggestions>
  );
}

const Passthrough = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

export function ChatPane({ taskId, query }: { taskId: string; query?: string }) {
  const adapter = useMemo(() => createTaskAdapter(taskId), [taskId]);
  const suggestions = SUGGESTIONS[taskId] ?? SUGGESTIONS.ask;

  const runtime = useLocalRuntime(adapter, {
    initialMessages: INITIAL_MESSAGES[taskId] ?? INITIAL_MESSAGES.ask,
  });
  const Followups = useMemo(
    () => function Followups() {
      return <QuickActions prompts={suggestions} />;
    },
    [suggestions],
  );

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <InitialPrompt taskId={taskId} query={query} />
      <Thread autoFocus={false} components={{ ToolFallback: ToolRouter, ToolGroup: Passthrough, FollowupSuggestions: Followups }} />
    </AssistantRuntimeProvider>
  );
}
