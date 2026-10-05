"use client";

import { AssistantRuntimeProvider, useAui, useLocalRuntime } from "@assistant-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
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

const Passthrough = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

export function ChatPane({ taskId, query }: { taskId: string; query?: string }) {
  const adapter = useMemo(() => createTaskAdapter(taskId), [taskId]);
  const suggestions = SUGGESTIONS[taskId] ?? SUGGESTIONS.ask;

  const runtime = useLocalRuntime(adapter, {
    initialMessages: INITIAL_MESSAGES[taskId] ?? INITIAL_MESSAGES.ask,
    adapters: {
      suggestion: {
        generate: async () => suggestions.map((prompt) => ({ prompt })),
      },
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <InitialPrompt taskId={taskId} query={query} />
      <Thread autoFocus={false} components={{ ToolFallback: ToolRouter, ToolGroup: Passthrough }} />
    </AssistantRuntimeProvider>
  );
}
