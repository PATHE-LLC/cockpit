import type { Task } from "./types";

export const TASKS: Task[] = [
  {
    id: "glenn-supabase-rls",
    kind: "slack-reply",
    title: "Reply to Glenn about Supabase RLS",
    summary:
      "Glenn asked in #eng-backend whether turning on RLS breaks the nightly cron and why policies feel slow. I drafted a reply with cited research.",
    app: "slack",
    requester: "Glenn",
    status: "needs-review",
    statusDetail: "Review",
    prepared: ["Slack reply draft", "4 cited sources", "Migration sketch"],
    due: "Today",
    autonomy: "Draft only. Nothing is posted until you press Send.",
  },
  {
    id: "alyssa-wix-quotes",
    kind: "email-draft",
    title: "Email Alyssa on custom quotes in Wix",
    summary:
      "Alyssa needs to know whether the client's Wix site can support custom quotes. I mapped each requirement to what Wix does natively and drafted the email.",
    app: "email",
    requester: "Alyssa",
    status: "needs-input",
    statusDetail: "Input",
    prepared: ["Feasibility matrix", "Email draft", "Two open questions"],
    due: "Thursday",
    autonomy: "Draft only. Email stays in your drafts folder until you send.",
  },
  {
    id: "model-6d-self-service",
    kind: "code-change",
    title: "Model 6D self-service form + reply",
    summary:
      "Support asked for a self-service contact form on Model 6D. I built it on a sandbox branch, ran the checks, and drafted the reply to Dana.",
    app: "github",
    requester: "Dana",
    status: "awaiting-approval",
    statusDetail: "Approve",
    prepared: ["3-file code change", "Checks passed", "Reply to Dana"],
    due: "Tomorrow",
    autonomy: "Safe code changes run in a sandbox. Pushing and PRs need your approval.",
  },
  {
    id: "recall-translation-figma",
    kind: "figma-design",
    title: "Recall translation screens in Figma",
    summary:
      "Collaborating with Sam on the Recall translation flow. I drafted three frames in the shared file and left three open questions on the canvas.",
    app: "figma",
    requester: "Sam",
    status: "collaborating",
    statusDetail: "Frames",
    prepared: ["3 draft frames", "3 canvas comments", "Language previews"],
    due: "Friday",
    autonomy: "Edits only inside the Recall translation page of the shared file.",
  },
  {
    id: "three-strands-dashboard",
    kind: "prd-prototype",
    title: "3 Strands dashboard PRD + prototype",
    summary:
      "Kickoff notes asked for a dashboard PRD and something clickable. The PRD is drafted and a frontend-only prototype is live beside this chat for iteration.",
    app: "meeting",
    requester: "Kickoff meeting",
    status: "iterating",
    statusDetail: "Prototype",
    prepared: ["PRD draft", "Live prototype v2", "GitHub repo + hosted URL"],
    due: "Next week",
    autonomy: "Prototype stays frontend-only. Commits go to a feature branch and auto-deploy.",
  },
];

export const TASK_BY_ID = Object.fromEntries(TASKS.map((t) => [t.id, t])) as Record<
  string,
  Task
>;

export const STATUS_LABEL: Record<Task["status"], string> = {
  "needs-review": "Needs review",
  "needs-input": "Needs your input",
  "awaiting-approval": "Awaiting approval",
  collaborating: "Collaborating",
  iterating: "Iterating",
  done: "Done",
};

export const USER_NAME = "Abdul";

export const BRIEFING = {
  headline: "5 items",
  summary:
    "Glenn's Supabase reply is drafted. Alyssa's Wix email needs two answers. Model 6D is ready to approve. Recall frames are in Figma. The 3 Strands PRD has a prototype.",
  transcript: [
    "Good morning, Abdul. Five items.",
    "Glenn's Supabase R L S reply is drafted.",
    "Alyssa's Wix quote email needs two answers.",
    "Model 6D is ready to approve. Nothing is pushed.",
    "Recall has three frames in Figma.",
    "The 3 Strands P R D and prototype are ready.",
  ],
  durationSeconds: 58,
} as const;
