"use client";

import { useRouter } from "next/navigation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { newTaskIntent, routePrompt } from "@/lib/chat/responders";

export function MainPrompt() {
  const router = useRouter();

  const go = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (newTaskIntent(trimmed)) {
      router.push(`/tasks/intake?q=${encodeURIComponent(trimmed)}`);
      return;
    }
    const routed = routePrompt(trimmed);
    if (routed) {
      router.push(`/tasks/${routed}?q=${encodeURIComponent(trimmed)}`);
      return;
    }
    const id = `chat-${Date.now().toString(36)}`;
    router.push(`/chats/${id}?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="flex flex-col gap-3" data-tour="composer">
      <PromptInput onSubmit={(m: PromptInputMessage) => go(m.text)}>
        <PromptInputBody>
          <PromptInputTextarea
            aria-label="Ask CockpitOS"
            placeholder="Message"
            className="min-h-14 px-4 pt-3.5"
          />
        </PromptInputBody>
        <PromptInputFooter className="px-3 pt-2 pb-3">
          <PromptInputTools />
          <PromptInputSubmit aria-label="Send" className="rounded-full" />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
