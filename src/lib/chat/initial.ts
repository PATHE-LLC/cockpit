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
        "Glenn asked in #eng-backend whether turning on RLS breaks the nightly reconcile cron, and why the orders list went from ~40ms to ~900ms.\n\nI checked the cron config and the Supabase docs. The job uses the service role key, so RLS does not apply to it. The slowdown is `auth.uid()` running once per row.\n\nA Slack reply and a migration sketch are ready to review. Nothing is posted.",
      ),
      tool("source_pills", { task: "glenn-supabase-rls" }),
      tool("inline_thread", { task: "glenn-supabase-rls" }),
      tool("slack_draft", { rev: 0 }),
      tool("migration_sql"),
    ),
  ],
  "alyssa-wix-quotes": [
    assistant(
      "m1",
      text(
        "Alyssa asked whether the client's Wix site can take a custom quote, send a PDF, and accept it online without custom code. She needs an answer by Thursday.\n\nI mapped each requirement to Wix Forms, Price Quotes, and Velo. Request, itemised quote, PDF, and online accept are native. A deposit is a two-step invoice. Automatic pricing needs custom code.\n\nThe email is drafted. Deposit on acceptance and tone are still open.",
      ),
      tool("source_pills", { task: "alyssa-wix-quotes" }),
      tool("inline_thread", { task: "alyssa-wix-quotes" }),
      tool("feasibility"),
      tool("email_questions"),
      tool("email_draft", { rev: 0 }),
    ),
  ],
  "model-6d-self-service": [
    assistant(
      "m1",
      text(
        "Dana asked for a self-service form so customers can update name, email, and phone from the account page, with validation on the phone number.\n\nI added `schema.ts`, `SelfServiceForm.tsx`, and `SelfServiceForm.test.tsx` on `cursor/model-6d-self-service-form`. Typecheck, lint, and the unit tests passed. Nothing is pushed.\n\nThe diff and a reply to Dana are ready. Opening a draft PR needs your approval.",
      ),
      tool("source_pills", { task: "model-6d-self-service" }),
      tool("code_approval"),
      tool("code_reply", { rev: 0 }),
      tool("pane_actions", { task: "model-6d-self-service" }),
    ),
  ],
  "recall-translation-figma": [
    assistant(
      "m1",
      text(
        "Sam asked for screens of the Recall translation flow in the shared Figma file.\n\nI drafted three frames on the translation page: language picker, live transcript, and bilingual review. Comments on the canvas cover always-visible original text and SRT export.\n\nThe frames are ready to review in Figma.",
      ),
      tool("figma_frames"),
      tool("pane_actions", { task: "recall-translation-figma" }),
    ),
  ],
  "three-strands-dashboard": [
    assistant(
      "m1",
      text(
        "The kickoff asked for a dashboard PRD and something clickable covering Pipeline, Delivery, and Customer Health.\n\nI drafted the PRD and built a frontend-only prototype. The current version is v2, with a trend chart and a strand filter.\n\nThe PRD and the prototype are ready to review.",
      ),
      tool("prototype_version", { version: 2, label: "Trend chart and strand filter" }),
    ),
  ],
  intake: [
    assistant("i0", text("What is it?")),
  ],
  ask: [
    assistant(
      "m1",
      text(
        "Ask about today's work.",
      ),
    ),
  ],
};

export const GENERAL_CHAT_MESSAGES: ThreadMessageLike[] = [
  assistant("g0", text("Personal chat. It stays off your checklist until you add it.")),
];

const user = (id: string, value: string): ThreadMessageLike => ({
  id,
  role: "user",
  content: [text(value)],
});

/** A stable personal chat the tour can open. Add to checklist is ready. */
export const TOUR_CHAT_MESSAGES: ThreadMessageLike[] = [
  ...GENERAL_CHAT_MESSAGES,
  user("g1", "Can we look at the Solar Light website redesign?"),
  assistant("g2", text("Still a personal chat. Add it to your checklist to track it on Website Redesign.")),
];
