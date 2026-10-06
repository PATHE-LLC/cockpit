import {
  RLS_MIGRATION_SQL,
  SLACK_DRAFT_CASUAL,
  SLACK_DRAFT_INITIAL,
  SLACK_DRAFT_SHORT,
  LANGS,
  type Lang,
} from "../demo/content";
import { TASKS } from "../demo/tasks";
import { useCockpit } from "../store";

export interface Reply {
  reasoning?: string;
  text: string;
  tool?: { name: ToolName; args: Record<string, unknown> };
}

export type ToolName =
  | "slack_draft"
  | "email_draft"
  | "email_questions"
  | "code_approval"
  | "code_reply"
  | "figma_update"
  | "prototype_version"
  | "task_links";

const has = (text: string, re: RegExp) => re.test(text.toLowerCase());

const state = () => useCockpit.getState();

function slackReply(text: string): Reply {
  const s = state();
  if (has(text, /short|brief|trim|tighten|condense/)) {
    s.setSlackDraft(SLACK_DRAFT_SHORT, true);
    return {
      reasoning: "Keeping the answer, the fix and all four citations, dropping the pairing offer.",
      text: "Trimmed it to three sentences. The answer, the fix and citations [1]–[4] are all still there.",
      tool: { name: "slack_draft", args: { rev: state().slack.rev } },
    };
  }
  if (has(text, /casual|friendly|tone|informal|warm/)) {
    s.setSlackDraft(SLACK_DRAFT_CASUAL, true);
    return {
      reasoning: "Matching how you usually write to Glenn in #eng-backend: short, direct, a little warm.",
      text: "Made it more conversational. Same facts and citations, less formal phrasing.",
      tool: { name: "slack_draft", args: { rev: state().slack.rev } },
    };
  }
  if (has(text, /original|reset|undo|revert|restore/)) {
    s.setSlackDraft(SLACK_DRAFT_INITIAL, true);
    return {
      text: "Restored the first draft.",
      tool: { name: "slack_draft", args: { rev: state().slack.rev } },
    };
  }
  if (has(text, /sql|migration|example|snippet|policy/)) {
    return {
      reasoning: "Pulling the policy shape from the Supabase performance guidance and your orders schema.",
      text: `Here's the migration sketch I'd attach in the thread. It enables RLS, indexes \`user_id\` and uses the cached \`(select auth.uid())\` form [2].\n\n\`\`\`sql\n${RLS_MIGRATION_SQL}\n\`\`\`\n\nI have not run this against staging. Want me to add a rollback block?`,
    };
  }
  if (has(text, /source|cite|citation|why|evidence|where|proof/)) {
    return {
      text: "Sources:\n\n- **[1]** Supabase docs: service keys bypass RLS.\n- **[2]** Supabase docs: wrap `auth.uid()` in a select and index policy columns.\n- **[3]** Postgres `CREATE POLICY`: `TO` limits which roles evaluate a policy.\n- **[4]** `nightly-reconcile.yml`: the cron uses `SERVICE_ROLE_KEY`.",
    };
  }
  if (has(text, /send|post|publish/)) {
    return {
      text: "I won't post this. Press **Send to #eng-backend** when the draft is ready.",
      tool: { name: "slack_draft", args: { rev: s.slack.rev } },
    };
  }
  return {
    text: "Edit the draft, or say what to change.",
  };
}

function emailReply(text: string): Reply {
  const s = state();
  if (has(text, /short|brief|trim|tighten|condense/)) {
    const applied = s.setEmailAnswers({ short: true });
    return {
      text: applied
        ? "Shortened."
        : "You've edited the body by hand, so I left it alone. Use **Regenerate** on the draft to rebuild it from the answers.",
      tool: { name: "email_draft", args: { rev: state().email.rev } },
    };
  }
  if (has(text, /formal|professional|polite/)) {
    const applied = s.setEmailAnswers({ tone: "formal" });
    return {
      text: applied ? "Switched to a more formal register." : "Your manual edits are kept. Regenerate to apply the formal tone.",
      tool: { name: "email_draft", args: { rev: state().email.rev } },
    };
  }
  if (has(text, /friendly|casual|warm/)) {
    const applied = s.setEmailAnswers({ tone: "friendly" });
    return {
      text: applied ? "Back to a friendly tone." : "Your manual edits are kept. Regenerate to apply the friendly tone.",
      tool: { name: "email_draft", args: { rev: state().email.rev } },
    };
  }
  if (has(text, /full|long|detail|expand/)) {
    const applied = s.setEmailAnswers({ short: false });
    return {
      text: applied ? "Restored the full version." : "Your manual edits are kept. Regenerate to restore the long form.",
      tool: { name: "email_draft", args: { rev: state().email.rev } },
    };
  }
  if (has(text, /velo|custom pricing|headless|code|rules/)) {
    return {
      reasoning: "Checking what Wix offers natively for rule-based pricing versus Velo.",
      text: "Automatic pricing from product rules isn't something Wix Price Quotes does natively, so it would need **Velo** (backend code and a collection of pricing rules) or a headless build. Both are real work, so I framed it in the email as a phase-two decision rather than promising it.",
    };
  }
  if (has(text, /deposit|pay|payment/)) {
    return {
      text: "Deposits are the least certain part. My read is: accept the quote, convert it to an invoice, request a partial payment. I flagged it **Partial** and marked it to verify against the client's plan. Answer the deposit question on the card and I'll update the email.",
      tool: { name: "email_questions", args: {} },
    };
  }
  if (has(text, /timeline|budget|cost|price/)) {
    return {
      text: "I deliberately left timeline and budget out. The native flow is configuration, not build. If custom pricing becomes a requirement, that's where estimates come in. Want a placeholder line asking Alyssa for the client's budget range?",
    };
  }
  return {
    text: "I can shorten the email, change the tone, or explain any row in the feasibility table. Answer the two questions on the card and the draft updates.",
    tool: { name: "email_questions", args: {} },
  };
}

function codeReply(text: string): Reply {
  const s = state();
  if (has(text, /phone.*(required|mandatory)|require.*phone|make phone required/)) {
    s.setPhoneRequired(true);
    return {
      reasoning: "Removing .optional() from the phone schema and updating the reply to Dana.",
      text: "Done. Phone is now **required** in `schema.ts` (2 lines removed) and the reply to Dana mentions it. I still need to re-run the test that asserts an empty phone is valid, so check the tests row before approving.",
      tool: { name: "code_reply", args: { rev: state().code.rev } },
    };
  }
  if (has(text, /phone.*optional|optional.*phone|make phone optional/)) {
    s.setPhoneRequired(false);
    return {
      text: "Phone is optional again.",
      tool: { name: "code_reply", args: { rev: state().code.rev } },
    };
  }
  if (has(text, /test|check|lint|typecheck|passing/)) {
    return {
      text: "All four checks passed in the sandbox:\n\n- **Typecheck:** 0 errors\n- **Lint:** 0 warnings\n- **Unit tests:** 9 of 9, two new (invalid phone rejected, valid values saved)\n- **Scope:** frontend only, no schema migrations or secrets touched\n\nNothing has left the sandbox yet.",
    };
  }
  if (has(text, /explain|summar|what changed|walk/)) {
    return {
      text: "Three files, all new:\n\n1. `schema.ts`: a zod schema for name, email and phone. Phone allows digits, spaces, `+`, `()` and `-`.\n2. `SelfServiceForm.tsx`: a controlled form with inline errors, a saving state and a confirmation message. Errors use `role=\"alert\"` so screen readers announce them.\n3. `SelfServiceForm.test.tsx`: covers the invalid-phone and happy paths.\n\nIt does not touch existing account code. Wiring it into the account page is the next step after you approve.",
    };
  }
  if (has(text, /push|pr\b|pull request|approve|ship|merge/)) {
    return {
      text: "Pushing a branch is outside what I can do unprompted at your current autonomy level, so I need your approval. Use the card below.",
      tool: { name: "code_approval", args: {} },
    };
  }
  if (has(text, /reply|dana|message/)) {
    return {
      text: "The draft reply to Dana is below. Edit it freely, and send it once you've decided on the push.",
      tool: { name: "code_reply", args: { rev: s.code.rev } },
    };
  }
  return {
    text: "I can explain the change, re-run the checks, make phone required, or revise the reply to Dana. Pushing the branch needs your approval.",
    tool: { name: "code_approval", args: {} },
  };
}

function figmaReply(text: string): Reply {
  const s = state();
  const lang = (Object.keys(LANGS) as Lang[]).find(
    (l) => has(text, new RegExp(LANGS[l].label.toLowerCase())) || has(text, new RegExp(LANGS[l].native.toLowerCase())),
  );
  if (lang) {
    s.figmaSetLang(lang);
    s.figmaSelect("live");
    return {
      text: `Switched the preview to **${LANGS[lang].label}**. ${lang === "ja" ? "Japanese lines run shorter but taller. I checked the speaker label still fits." : "The translated line is about 15% longer than English, so I gave the transcript row extra room."}`,
      tool: { name: "figma_update", args: { change: "lang" } },
    };
  }
  if (has(text, /error|unavailable|fail|offline/)) {
    const added = s.figmaAddErrorFrame();
    return {
      reasoning: "Adding an error frame to the shared page, matching the spacing of frame 2.",
      text: added
        ? "Added **4 · Translation unavailable** to the Recall page: a retry button, a note that the original transcript is still being captured, and a link to switch language."
        : "That frame already exists on the canvas. Select it to review.",
      tool: { name: "figma_update", args: { change: "frame" } },
    };
  }
  if (has(text, /hover|always|original/)) {
    const mode = has(text, /hover/) ? "hover" : "always";
    s.figmaSetOriginalMode(mode);
    if (!state().figma.resolved.includes("c1")) s.figmaResolve("c1");
    return {
      text:
        mode === "hover"
          ? "Original text now appears on hover or focus only. This is cleaner for long calls, but harder for bilingual speakers to check at a glance. I resolved my own comment on frame 2."
          : "Original text is always visible, dimmed under the translation. Good for bilingual checking, busier on small screens.",
      tool: { name: "figma_update", args: { change: "original" } },
    };
  }
  if (has(text, /srt|subtitle|caption/)) {
    s.figmaSetSrt(true);
    return {
      text: "Added **SRT** to the export menu on the bilingual review frame.",
      tool: { name: "figma_update", args: { change: "srt" } },
    };
  }
  if (has(text, /approve|looks good|lgtm|sign off/)) {
    const id = state().figma.selected;
    s.figmaApprove(id, true);
    return { text: "Marked the selected frame approved. Sam will see the status change in Figma." };
  }
  return {
    text: "Say what to change on the frames.",
  };
}

const PROTOTYPE_RULES: Array<{
  test: RegExp;
  patch: Partial<import("../demo/content").PrototypeConfig>;
  label: string;
  say: string;
}> = [
  { test: /compact|dense|denser|tighter|smaller/, patch: { density: "compact" }, label: "Compact density", say: "Switched to **compact** density: tighter cards, smaller gaps, more rows above the fold." },
  { test: /comfortable|spacious|roomier|looser/, patch: { density: "comfortable" }, label: "Comfortable density", say: "Back to **comfortable** density." },
  { test: /dark/, patch: { theme: "dark" }, label: "Dark theme", say: "Applied the **dark** theme. Chart colors were rebalanced for contrast." },
  { test: /light theme|light mode|go light/, patch: { theme: "light" }, label: "Light theme", say: "Back to the **light** theme." },
  { test: /line/, patch: { chart: "line" }, label: "Line chart", say: "Trend chart is now a **line** chart. Better for spotting direction over 12 weeks." },
  { test: /\bbar/, patch: { chart: "bars" }, label: "Bar chart", say: "Trend chart is now **bars**." },
  { test: /amber|orange|warm/, patch: { accent: "amber" }, label: "Amber accent", say: "Accent changed to **amber**." },
  { test: /blue/, patch: { accent: "blue" }, label: "Blue accent", say: "Accent changed to **blue**." },
  { test: /teal|green/, patch: { accent: "teal" }, label: "Teal accent", say: "Accent changed to **teal**." },
  { test: /hide trend|no trend|remove trend|without trend/, patch: { trends: false }, label: "Hide trends", say: "Trend chart hidden. The summary row now carries the page." },
  { test: /show trend|add trend|bring back trend/, patch: { trends: true }, label: "Show trends", say: "Trend chart is back." },
  { test: /only delivery|delivery only|focus on delivery/, patch: { strand: "delivery" }, label: "Delivery strand", say: "Filtered to the **Delivery** strand." },
  { test: /only pipeline|pipeline only|focus on pipeline/, patch: { strand: "pipeline" }, label: "Pipeline strand", say: "Filtered to the **Pipeline** strand." },
  { test: /only (customer|health)|health only|focus on (customer|health)/, patch: { strand: "health" }, label: "Customer Health strand", say: "Filtered to **Customer Health**." },
  { test: /all strands|show everything|show all/, patch: { strand: "all" }, label: "All strands", say: "Showing **all** strands." },
];

function prototypeReply(text: string): Reply {
  const s = state();
  const revert = text.toLowerCase().match(/(?:revert|go back|undo).*?v?(\d+)/);
  if (revert) {
    const version = Number(revert[1]);
    if (s.prototype.versions.some((v) => v.version === version)) {
      s.restorePrototypeVersion(version);
      return {
        text: `Restored **v${version}**. The live preview updated. History is kept, so you can jump forward again.`,
        tool: { name: "prototype_version", args: { version, restored: true } },
      };
    }
    return { text: `I don't have a v${version}. Versions so far: ${s.prototype.versions.map((v) => `v${v.version}`).join(", ")}.` };
  }
  if (has(text, /prd|requirement|doc/) && has(text, /\badd\b|include|append/)) {
    const raw = text.replace(/^.*?(?:add|include|append)\s+(?:a\s+|an\s+|the\s+)?(?:requirement\s*(?:for|that|to)?\s*)?/i, "").trim().replace(/\.$/, "");
    const clean = raw.length > 3 ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Export the visible strand as CSV";
    s.appendRequirement(`${clean}.`);
    return {
      text: `Added to Requirements: "${clean}."`,
    };
  }
  const matched = PROTOTYPE_RULES.filter((r) => r.test.test(text.toLowerCase()));
  if (matched.length) {
    const patch = Object.assign({}, ...matched.map((m) => m.patch));
    const label = matched.map((m) => m.label).join(" + ");
    const version = s.applyPrototypeChange(patch, label);
    return {
      reasoning: "Updating the prototype's config and pushing a commit to the feature branch.",
      text: `${matched.map((m) => m.say).join(" ")}\n\n**v${version}**`,
      tool: { name: "prototype_version", args: { version, label } },
    };
  }
  return {
    text: "Say what to change.",
  };
}

export function newTaskIntent(text: string): { bare: boolean; detail: string } | null {
  const match = text
    .trim()
    .match(/^(?:please\s+)?(?:new|create|add|start)(?:\s+an|\s+a)?\s+task\b[:\s,-]*(.*)$/i);
  if (!match) return null;
  const detail = match[1].trim();
  return { bare: detail.length === 0, detail };
}

function intakeReply(text: string): Reply {
  const s = state();
  const trimmed = text.trim();
  const intent = newTaskIntent(trimmed);
  const phase = s.intake.phase;

  if (!phase) {
    if (!trimmed || intent?.bare) {
      s.setIntake({ phase: "what", what: "", who: "" });
      return { text: "What is it?" };
    }
    const what = intent?.detail || trimmed;
    s.setIntake({ phase: "who", what, who: "" });
    return { text: "Who is it for?" };
  }
  if (phase === "what") {
    if (!trimmed || intent?.bare) return { text: "What is it?" };
    const what = intent?.detail || trimmed;
    s.setIntake({ phase: "who", what, who: "" });
    return { text: "Who is it for?" };
  }
  if (phase === "who") {
    s.setIntake({ phase: "done", what: s.intake.what, who: trimmed });
    return { text: "What does done look like?" };
  }
  const title = s.intake.what || trimmed;
  s.addTask({
    title,
    requester: s.intake.who || "You",
    summary: trimmed,
    due: "Soon",
  });
  s.setIntake({ phase: null, what: "", who: "" });
  return { text: `Added “${title}” to your checklist.` };
}

function adHocReply(text: string): Reply {
  if (has(text, /what|today|plan|priorit|first|focus/)) {
    return {
      reasoning: "Ranking today's tasks by due date and whether they are blocked on you.",
      text: "Here's how I'd order your day:\n\n1. **Alyssa's Wix email** is due Thursday and needs two answers from you. It takes two minutes.\n2. **Glenn's Supabase reply** is ready, and he's blocked on a merge.\n3. **Model 6D form** needs a push approval.\n4. **Recall frames** and **3 Strands prototype** are collaborative and can wait for a focused block.",
      tool: { name: "task_links", args: {} },
    };
  }
  return {
    text: "I don't have a prepared task for that yet. In the real product I'd create a task, gather context from Slack, Asana, email and code, and prepare a draft. In this prototype I can open any of today's five tasks.",
    tool: { name: "task_links", args: {} },
  };
}

export function respond(taskId: string, text: string): Reply {
  if (taskId !== "intake" && newTaskIntent(text)) {
    state().handoffToIntake(text);
    return { text: "Starting a new task." };
  }
  if (taskId === "intake") return intakeReply(text);
  switch (taskId) {
    case "glenn-supabase-rls":
      return slackReply(text);
    case "alyssa-wix-quotes":
      return emailReply(text);
    case "model-6d-self-service":
      return codeReply(text);
    case "recall-translation-figma":
      return figmaReply(text);
    case "three-strands-dashboard":
      return prototypeReply(text);
    default:
      return adHocReply(text);
  }
}

export function routePrompt(text: string): string | null {
  const t = text.toLowerCase();
  if (/glenn|supabase|\brls\b|row level/.test(t)) return "glenn-supabase-rls";
  if (/alyssa|wix|custom quote|\bquote/.test(t)) return "alyssa-wix-quotes";
  if (/model 6d|6d|self-service|self service/.test(t)) return "model-6d-self-service";
  if (/recall|translation|figma/.test(t)) return "recall-translation-figma";
  if (/3 strands|three strands|strands|prd|dashboard|prototype/.test(t)) return "three-strands-dashboard";
  return null;
}

export const TASK_IDS = TASKS.map((t) => t.id);
