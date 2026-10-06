import type { ChatModelAdapter } from "@assistant-ui/react";
import { playCue } from "../sounds";
import { respond } from "./responders";

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const id = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(id);
      resolve();
    });
  });

function lastUserText(messages: readonly { role: string; content: readonly { type: string; text?: string }[] }[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    return m.content
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join(" ");
  }
  return "";
}

type Part =
  | { type: "reasoning"; text: string }
  | { type: "text"; text: string }
  | {
      type: "tool-call";
      toolCallId: string;
      toolName: string;
      args: Record<string, never> | Record<string, string | number | boolean>;
      argsText: string;
      result: string;
    };

export function createTaskAdapter(taskId: string): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const input = lastUserText(messages as never);
      if (input.trim()) playCue("send");
      if (/^\/error\b/i.test(input.trim())) {
        await sleep(450, abortSignal);
        throw new Error("The demo model is unreachable. Retry from the message actions.");
      }

      await sleep(350, abortSignal);
      if (abortSignal.aborted) return;

      const reply = respond(taskId, input);
      const parts: Part[] = [];

      if (reply.reasoning) {
        parts.push({ type: "reasoning", text: reply.reasoning });
        yield { content: [...parts] } as never;
        await sleep(600, abortSignal);
        if (abortSignal.aborted) return;
      }

      const textPart: Part = { type: "text", text: "" };
      parts.push(textPart);
      const tokens = reply.text.match(/\S+\s*|\n+/g) ?? [];
      for (let i = 0; i < tokens.length; i += 2) {
        if (abortSignal.aborted) return;
        textPart.text += tokens.slice(i, i + 2).join("");
        yield { content: parts.map((p) => ({ ...p })) } as never;
        await sleep(22, abortSignal);
      }

      if (reply.tool) {
        const args = reply.tool.args as Record<string, string | number | boolean>;
        parts.push({
          type: "tool-call",
          toolCallId: `tc_${Date.now()}`,
          toolName: reply.tool.name,
          args,
          argsText: JSON.stringify(args),
          result: "ok",
        });
      }
      yield { content: parts.map((p) => ({ ...p })), status: { type: "complete", reason: "stop" } } as never;
    },
  };
}
