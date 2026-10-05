import type { ThreadMessageLike } from "@assistant-ui/react";

type Part = Exclude<ThreadMessageLike["content"], string>[number];

const tool = (name: string, args: Record<string, string | number | boolean> = {}): Part => ({
  type: "tool-call",
  toolCallId: `init_${name}`,
  toolName: name,
  args,
  argsText: JSON.stringify(args),
  result: "ok",
});

const assistant = (id: string, ...content: Part[]): ThreadMessageLike => ({
  id,
  role: "assistant",
  content,
  status: { type: "complete", reason: "stop" },
});

const text = (t: string): Part => ({ type: "text", text: t });

export const INITIAL_MESSAGES: Record<string, ThreadMessageLike[]> = {
  "glenn-supabase-rls": [
    assistant(
      "m1",
      text(
        "I picked this up from Glenn's message in #eng-backend and prepared a reply.\n\n**Short answer for Glenn:** RLS won't break the nightly cron because it runs on `service_role`, which bypasses RLS. The 40ms → 900ms jump is `auth.uid()` being evaluated per row, and it has a known fix.\n\nThe draft is below with citations, and the sources are in the panel. Edit it directly, or ask me to shorten it, change the tone or add the migration SQL. I won't post anything until you press Send.",
      ),
      tool("slack_draft", { rev: 0 }),
    ),
  ],
  "alyssa-wix-quotes": [
    assistant(
      "m1",
      text(
        "Alyssa needs an answer by Thursday. I mapped each requirement to what Wix does natively, and the core flow works without custom code: request a quote, build an itemised quote, send a PDF, accept online.\n\nTwo things I can't decide for you are below. They change the email.",
      ),
      tool("email_questions"),
      tool("email_draft", { rev: 0 }),
    ),
  ],
  "model-6d-self-service": [
    assistant(
      "m1",
      text(
        "Dana's request is built on a sandbox branch: a validated self-service form for name, email and phone. All four checks passed and nothing has been pushed.\n\nReview the diff in the panel. The reply to Dana is drafted below, and pushing the branch needs your approval.",
      ),
      tool("code_approval"),
      tool("code_reply", { rev: 0 }),
    ),
  ],
  "recall-translation-figma": [
    assistant(
      "m1",
      text(
        "Sam and I have three frames on the Recall translation page: the language picker, the live translated transcript and the bilingual review. I left three comments on the canvas, and the biggest open call is whether the original text is always visible or only on hover.\n\nSelect a frame to review it. Ask me to show a different language, add an error state, or change how the original text appears.",
      ),
    ),
  ],
  "three-strands-dashboard": [
    assistant(
      "m1",
      text(
        "The PRD is drafted from the kickoff notes and a frontend-only prototype is running beside this chat. It's at **v2** with the strand summary, trend chart and filter. Everything is committed to a feature branch and auto-deployed.\n\nTell me what to change and the preview updates live: *make it compact*, *dark theme*, *use a line chart*, *only delivery*. You can also say *add a requirement for CSV export to the PRD*.",
      ),
      tool("prototype_version", { version: 2, label: "Added trend chart and strand filter" }),
    ),
  ],
  ask: [
    assistant(
      "m1",
      text(
        "Ask me anything about today's work. I can reorder your day, summarise a thread, or open one of the five prepared tasks.",
      ),
    ),
  ],
};
