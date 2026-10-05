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
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { routePrompt } from "@/lib/chat/responders";

const SUGGESTIONS = [
  "What should I do first today?",
  "Make Glenn's reply shorter",
  "Make the 3 Strands prototype compact",
  "Add an error state to the Recall frames",
];

export function MainPrompt() {
  const router = useRouter();

  const go = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const id = routePrompt(trimmed) ?? "ask";
    router.push(`/tasks/${id}?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <PromptInput
        onSubmit={(m: PromptInputMessage) => go(m.text)}
        className="[&_[data-slot=input-group]]:rounded-3xl [&_[data-slot=input-group]]:bg-card [&_[data-slot=input-group]]:shadow-xs"
      >
        <PromptInputBody>
          <PromptInputTextarea
            aria-label="Ask CockpitOS"
            placeholder="Ask CockpitOS to draft, research, review or build…"
            className="min-h-14"
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <span className="px-2 text-xs text-muted-foreground">Enter to send · Shift+Enter for a new line</span>
          </PromptInputTools>
          <PromptInputSubmit aria-label="Send prompt" />
        </PromptInputFooter>
      </PromptInput>
      <Suggestions className="-mx-1 px-1">
        {SUGGESTIONS.map((s) => (
          <Suggestion key={s} suggestion={s} onClick={go} />
        ))}
      </Suggestions>
    </div>
  );
}
