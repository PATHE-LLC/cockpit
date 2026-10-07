import type { ThreadMessageLike } from "@assistant-ui/react";

type Part = Exclude<ThreadMessageLike["content"], string>[number];

type LoosePart = {
  type: string;
  text?: string;
  toolCallId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  argsText?: string;
  result?: unknown;
};

function plainArgs(args: Record<string, unknown> | undefined) {
  const out: Record<string, string | number | boolean> = {};
  if (!args) return out;
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") out[key] = value;
  }
  return out;
}

export function snapshotThread(
  messages: readonly { id: string; role: string; content: readonly LoosePart[] }[],
): ThreadMessageLike[] {
  const out: ThreadMessageLike[] = [];
  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") continue;
    const content: Part[] = [];
    for (const part of message.content) {
      if ((part.type === "text" || part.type === "reasoning") && part.text) {
        content.push({ type: part.type, text: part.text });
      } else if (part.type === "tool-call" && part.toolName && part.toolCallId) {
        const args = plainArgs(part.args);
        content.push({
          type: "tool-call",
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          args,
          argsText: part.argsText ?? JSON.stringify(args),
          result: typeof part.result === "string" ? part.result : "ok",
        });
      }
    }
    if (!content.length) continue;
    out.push({
      id: message.id,
      role: message.role,
      content,
      ...(message.role === "assistant" ? { status: { type: "complete", reason: "stop" } } : {}),
    });
  }
  return out;
}

export function threadText(messages: readonly ThreadMessageLike[]) {
  const lines: string[] = [];
  for (const message of messages) {
    if (typeof message.content === "string") {
      if (message.content) lines.push(message.content);
      continue;
    }
    for (const part of message.content) {
      if ((part.type === "text" || part.type === "reasoning") && part.text) lines.push(part.text);
    }
  }
  return lines.join("\n");
}

export function withProjectLookup(messages: ThreadMessageLike[], taskId: string, projectId: string): ThreadMessageLike[] {
  const args = { task: taskId, set: projectId };
  return [
    ...messages,
    {
      id: `lookup-${taskId}`,
      role: "assistant",
      content: [
        { type: "text", text: "Opened the library for this project." },
        {
          type: "tool-call",
          toolCallId: `lookup_${taskId}`,
          toolName: "source_pills",
          args,
          argsText: JSON.stringify(args),
          result: "ok",
        },
      ],
      status: { type: "complete", reason: "stop" },
    },
  ];
}

export function chatTitle(text: string) {
  const line = text.replace(/\s+/g, " ").trim();
  if (!line) return "Chat";
  return line.length > 72 ? `${line.slice(0, 69).trimEnd()}…` : line;
}
