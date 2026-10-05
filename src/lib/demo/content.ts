import type { Citation, EmailDraft } from "./types";

/* ---------- Task 1: Glenn / Supabase RLS ---------- */

export const GLENN_THREAD = {
  channel: "#eng-backend",
  author: "Glenn",
  time: "Yesterday, 6:42 PM",
  message:
    "Quick q before I merge the orders RLS migration: will turning RLS on break the nightly reconcile cron? Also staging went from ~40ms to ~900ms on the orders list once I added the policy. Is auth.uid() just slow at scale?",
};

export const RLS_CITATIONS: Citation[] = [
  {
    id: "1",
    title: "Row Level Security — Bypassing RLS",
    publisher: "Supabase Docs",
    url: "https://supabase.com/docs/guides/database/postgres/row-level-security",
    quote:
      "Service keys never use RLS. Supabase provides special \"service\" keys, which can be used to bypass RLS.",
  },
  {
    id: "2",
    title: "RLS performance recommendations",
    publisher: "Supabase Docs",
    url: "https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations",
    quote:
      "Wrap functions like auth.uid() in a select so the planner can cache the result per statement instead of calling it for every row. Add indexes on columns used in policies.",
  },
  {
    id: "3",
    title: "CREATE POLICY",
    publisher: "PostgreSQL Docs",
    url: "https://www.postgresql.org/docs/current/sql-createpolicy.html",
    quote:
      "Roles that have the BYPASSRLS attribute and table owners bypass policies unless FORCE ROW LEVEL SECURITY is set. Specifying roles with TO limits which sessions evaluate the policy.",
  },
  {
    id: "4",
    title: "nightly-reconcile job config",
    publisher: "Internal · infra repo",
    url: "https://github.com/acme/infra/blob/main/cron/nightly-reconcile.yml",
    quote: "SUPABASE_KEY is read from SERVICE_ROLE_KEY. The job never uses the anon key.",
    internal: true,
  },
];

export const SLACK_DRAFT_INITIAL = `Hey Glenn, short answer: turning on RLS won't break the nightly reconcile cron. It connects with the service_role key (checked the cron config), and service keys skip RLS entirely [1][4]. Anything on anon/authenticated is denied until a policy exists, so ship the policies in the same migration as ENABLE ROW LEVEL SECURITY.

On the 40ms → 900ms jump: that's the classic per-row auth.uid() call. Wrap it as (select auth.uid()) = user_id so Postgres evaluates it once per statement, and index the column the policy filters on [2]. Add "to authenticated" so anon sessions don't evaluate the policy at all [3].

Migration sketch is in the thread below. Happy to pair on it this afternoon if useful.`;

export const SLACK_DRAFT_SHORT = `Glenn, RLS won't break the nightly cron: it uses service_role, which bypasses RLS [1][4]. The slowdown is auth.uid() running per row. Use (select auth.uid()) = user_id, index user_id, and add "to authenticated" to the policy [2][3]. Migration sketch below.`;

export const SLACK_DRAFT_CASUAL = `Glenn, good news: the cron's safe. It runs on service_role, and that skips RLS [1][4]. Your slow query is auth.uid() getting called on every row. Wrap it in a select, index user_id, and scope the policy "to authenticated" [2][3]. Sketch below, ping me if you want to pair.`;

export const RLS_MIGRATION_SQL = `-- orders: enable RLS and add a fast policy in one migration
alter table public.orders enable row level security;

create index if not exists orders_user_id_idx
  on public.orders (user_id);

create policy "Users read their own orders"
  on public.orders
  for select
  to authenticated
  using ((select auth.uid()) = user_id);`;

/* ---------- Task 2: Alyssa / Wix custom quotes ---------- */

export const ALYSSA_THREAD = {
  from: "Alyssa Chen",
  subject: "Can the client's Wix site do custom quotes?",
  time: "Yesterday, 4:15 PM",
  message:
    "Hi Abdul, the client wants visitors to request a custom quote, receive a PDF quote with negotiated prices, and accept it online (ideally paying a deposit). Can Wix do that without custom code? I need to tell them by Thursday.",
};

export type Verdict = "native" | "partial" | "custom";

export interface FeasibilityRow {
  requirement: string;
  verdict: Verdict;
  how: string;
  verify?: string;
}

export const FEASIBILITY: FeasibilityRow[] = [
  {
    requirement: "Visitors request a quote",
    verdict: "native",
    how: "Wix Forms with a product/service picker, feeding the Wix CRM.",
  },
  {
    requirement: "Staff builds a quote with negotiated prices",
    verdict: "native",
    how: "Wix Price Quotes lets you create itemised quotes with custom line prices and send them from the dashboard.",
  },
  {
    requirement: "PDF quote the customer can download",
    verdict: "native",
    how: "Quotes are sent as a branded link and can be downloaded as PDF by the customer.",
  },
  {
    requirement: "Customer accepts online",
    verdict: "native",
    how: "Customers can accept a quote from the link, which moves it to accepted in the dashboard.",
  },
  {
    requirement: "Deposit paid on acceptance",
    verdict: "partial",
    how: "Convert the accepted quote into an invoice and request a partial payment. It's two steps, not one.",
    verify: "Confirm deposit support on the client's plan and payment provider.",
  },
  {
    requirement: "Prices calculated automatically from product rules",
    verdict: "custom",
    how: "Not available natively. Needs Velo code or a headless build.",
  },
];

export const WIX_CITATIONS: Citation[] = [
  {
    id: "1",
    title: "Wix Price Quotes: creating and sending quotes",
    publisher: "Wix Help Center",
    url: "https://support.wix.com/en/article/wix-price-quotes-creating-and-sending-a-price-quote",
    quote: "Create a price quote with itemised services and products, then send it to your client to accept.",
  },
  {
    id: "2",
    title: "Wix Forms: adding a form to your site",
    publisher: "Wix Help Center",
    url: "https://support.wix.com/en/article/wix-forms-adding-and-setting-up-a-form",
    quote: "Collect submissions in your dashboard and route them to contacts automatically.",
  },
  {
    id: "3",
    title: "Velo by Wix: custom code overview",
    publisher: "Wix Velo Docs",
    url: "https://dev.wix.com/docs/velo",
    quote: "Add custom logic, backend code and database collections to a Wix site.",
  },
];

export const emailBody = (opts: {
  deposit: boolean | null;
  tone: "friendly" | "formal";
  short?: boolean;
}): string => {
  const greeting = opts.tone === "friendly" ? "Hi Alyssa," : "Dear Alyssa,";
  const depositLine =
    opts.deposit === null
      ? "Deposit on acceptance is the one thing I want to confirm before we promise it. I'll check it against the client's plan and payment provider."
      : opts.deposit
        ? "Deposit on acceptance works with one extra step: once the customer accepts, we convert the quote to an invoice and request a partial payment. It isn't one click, so I'd set that expectation with the client."
        : "Since the client doesn't need a deposit on acceptance, the flow stays simple: request, quote, accept. No invoice step required.";
  const signoff = opts.tone === "friendly" ? "Thanks," : "Kind regards,";
  if (opts.short) {
    return `${greeting}

Yes, mostly. Wix Forms plus Wix Price Quotes covers request, itemised quote, PDF and online acceptance without custom code. ${depositLine}

Automatic pricing from product rules is the one thing that needs Velo or a headless build.

${signoff}
Abdul`;
  }
  return `${greeting}

Good news: the core of this works on Wix without custom code.

• Request a quote: a Wix Form with a product picker feeds the CRM.
• Build the quote: Wix Price Quotes supports itemised lines with negotiated prices.
• PDF + online acceptance: customers can download the quote and accept it from the link.

${depositLine}

The one thing that is not native is automatic pricing from product rules. If the client needs that, we'd need Velo code or a headless build, which changes the timeline and budget.

Recommendation: start with the native flow and revisit custom pricing after the first few quotes. I can walk the client through a demo on Thursday.

${signoff}
Abdul`;
};

export const EMAIL_DRAFT_INITIAL: EmailDraft = {
  to: "alyssa.chen@example.com",
  subject: "Re: Can the client's Wix site do custom quotes?",
  body: emailBody({ deposit: null, tone: "friendly" }),
};

/* ---------- Task 3: Model 6D self-service form ---------- */

export const DANA_REQUEST = {
  author: "Dana (Support)",
  source: "Asana · Model 6D backlog",
  message:
    "Customers keep emailing us to change their shipping contact. Can we let them update name, email and phone themselves from the account page? Needs validation so we stop getting bad phone numbers.",
};

export interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
  language: string;
  patch: string;
}

export const MODEL_6D_DIFF: DiffFile[] = [
  {
    path: "src/features/model-6d/schema.ts",
    additions: 22,
    deletions: 0,
    language: "diff",
    patch: `+import { z } from "zod";
+
+const phonePattern = /^\\+?[0-9 ()-]{7,20}$/;
+
+export const contactSchema = z.object({
+  name: z.string().trim().min(2, "Enter the contact's full name"),
+  email: z.string().trim().email("Enter a valid email address"),
+  phone: z
+    .string()
+    .trim()
+    .regex(phonePattern, "Use digits, spaces, + or () only")
+    .optional()
+    .or(z.literal("")),
+});
+
+export type ContactValues = z.infer<typeof contactSchema>;`,
  },
  {
    path: "src/features/model-6d/SelfServiceForm.tsx",
    additions: 58,
    deletions: 0,
    language: "diff",
    patch: `+"use client";
+
+import { useState } from "react";
+import { contactSchema, type ContactValues } from "./schema";
+
+export function SelfServiceForm({
+  initial,
+  onSave,
+}: {
+  initial: ContactValues;
+  onSave: (values: ContactValues) => Promise<void>;
+}) {
+  const [values, setValues] = useState(initial);
+  const [errors, setErrors] = useState<Record<string, string>>({});
+  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
+
+  async function submit(event: React.FormEvent) {
+    event.preventDefault();
+    const parsed = contactSchema.safeParse(values);
+    if (!parsed.success) {
+      setErrors(
+        Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])),
+      );
+      return;
+    }
+    setErrors({});
+    setStatus("saving");
+    try {
+      await onSave(parsed.data);
+      setStatus("saved");
+    } catch {
+      setStatus("error");
+    }
+  }
+
+  return (
+    <form onSubmit={submit} noValidate aria-busy={status === "saving"}>
+      {(["name", "email", "phone"] as const).map((field) => (
+        <label key={field}>
+          {field}
+          <input
+            name={field}
+            value={values[field] ?? ""}
+            onChange={(e) => setValues({ ...values, [field]: e.target.value })}
+            aria-invalid={Boolean(errors[field])}
+          />
+          {errors[field] && <p role="alert">{errors[field]}</p>}
+        </label>
+      ))}
+      <button disabled={status === "saving"}>Save contact</button>
+      {status === "saved" && <p role="status">Contact updated.</p>}
+      {status === "error" && <p role="alert">Couldn't save. Try again.</p>}
+    </form>
+  );
+}`,
  },
  {
    path: "src/features/model-6d/SelfServiceForm.test.tsx",
    additions: 41,
    deletions: 0,
    language: "diff",
    patch: `+import { render, screen } from "@testing-library/react";
+import userEvent from "@testing-library/user-event";
+import { SelfServiceForm } from "./SelfServiceForm";
+
+const initial = { name: "Jo Park", email: "jo@example.com", phone: "" };
+
+it("rejects an invalid phone number", async () => {
+  const onSave = vi.fn();
+  render(<SelfServiceForm initial={initial} onSave={onSave} />);
+  await userEvent.type(screen.getByLabelText(/phone/i), "abc");
+  await userEvent.click(screen.getByRole("button", { name: /save/i }));
+  expect(await screen.findByRole("alert")).toHaveTextContent("digits");
+  expect(onSave).not.toHaveBeenCalled();
+});
+
+it("saves valid values and confirms", async () => {
+  const onSave = vi.fn().mockResolvedValue(undefined);
+  render(<SelfServiceForm initial={initial} onSave={onSave} />);
+  await userEvent.click(screen.getByRole("button", { name: /save/i }));
+  expect(onSave).toHaveBeenCalledWith(initial);
+  expect(await screen.findByRole("status")).toHaveTextContent("updated");
+});`,
  },
];

export const MODEL_6D_CHECKS = [
  { name: "Typecheck", result: "Passed", detail: "tsc --noEmit · 0 errors" },
  { name: "Lint", result: "Passed", detail: "eslint · 0 warnings" },
  { name: "Unit tests", result: "Passed", detail: "9 of 9 passing · 2 new" },
  { name: "Scope check", result: "Passed", detail: "Frontend-only · no schema or secrets touched" },
] as const;

export const DANA_REPLY_INITIAL = `Hi Dana, the self-service contact form for Model 6D is built and tested on a branch (cursor/model-6d-self-service-form). Customers can update their name, email and phone from the account page, with inline validation so bad phone numbers get caught before they save.

I haven't pushed it yet. Once I open the PR you can try it on the preview link. Can you confirm whether phone should stay optional?`;

/* ---------- Task 4: Recall translation screens ---------- */

export interface FigmaFrame {
  id: string;
  name: string;
  note: string;
  author: "AI" | "Sam" | "You";
  approved: boolean;
}

export const FIGMA_FRAMES_INITIAL: FigmaFrame[] = [
  {
    id: "picker",
    name: "1 · Choose translation language",
    note: "Entry point from the call toolbar",
    author: "AI",
    approved: true,
  },
  {
    id: "live",
    name: "2 · Live translated transcript",
    note: "Original and translated lines, speaker labels",
    author: "AI",
    approved: false,
  },
  {
    id: "review",
    name: "3 · Bilingual review after the call",
    note: "Side-by-side edit and export",
    author: "Sam",
    approved: false,
  },
];

export const FIGMA_COMMENTS = [
  {
    id: "c1",
    frame: "live",
    author: "AI",
    text: "Should original text be always visible or only on hover? I defaulted to always visible, dimmed.",
  },
  {
    id: "c2",
    frame: "live",
    author: "Sam",
    text: "Low-confidence words get a dotted underline. Need a tooltip state too.",
  },
  {
    id: "c3",
    frame: "review",
    author: "AI",
    text: "Export options: PDF, DOCX, copy. Do we need SRT for subtitles in v1?",
  },
] as const;

export type Lang = "es" | "fr" | "ja";

export const LANGS: Record<Lang, { label: string; native: string; lines: [string, string, string] }> = {
  es: {
    label: "Spanish",
    native: "Español",
    lines: [
      "Gracias por unirse. Empecemos con el plan del trimestre.",
      "Necesitamos confirmar la fecha de lanzamiento antes del viernes.",
      "Yo me encargo del resumen y lo comparto después de la llamada.",
    ],
  },
  fr: {
    label: "French",
    native: "Français",
    lines: [
      "Merci de nous avoir rejoints. Commençons par le plan du trimestre.",
      "Nous devons confirmer la date de lancement avant vendredi.",
      "Je m'occupe du résumé et je le partage après l'appel.",
    ],
  },
  ja: {
    label: "Japanese",
    native: "日本語",
    lines: [
      "ご参加ありがとうございます。四半期の計画から始めましょう。",
      "金曜日までにリリース日を確定する必要があります。",
      "要約は私が担当し、通話後に共有します。",
    ],
  },
};

export const ORIGINAL_LINES: [string, string, string] = [
  "Thanks for joining. Let's start with the quarter plan.",
  "We need to confirm the launch date before Friday.",
  "I'll own the summary and share it after the call.",
];

/* ---------- Task 5: 3 Strands PRD + prototype ---------- */

export interface PrdSection {
  id: string;
  heading: string;
  body: string;
}

export const PRD_TITLE_INITIAL = "3 Strands Dashboard — Product Requirements";

export const PRD_SECTIONS_INITIAL: PrdSection[] = [
  {
    id: "overview",
    heading: "Overview",
    body: "A single dashboard that shows the health of the three strands of the 3 Strands program — Pipeline, Delivery and Customer Health — so the leadership team can see what needs attention in under a minute.",
  },
  {
    id: "problem",
    heading: "Problem",
    body: "Status lives in three different tools and a weekly slide deck. By the time leadership sees a risk, it is already a week old, and nobody agrees which numbers are current.",
  },
  {
    id: "users",
    heading: "Users",
    body: "Program leads (daily), executives (weekly), and strand owners (as needed). Executives need the summary; strand owners need to drill into their own strand.",
  },
  {
    id: "requirements",
    heading: "Requirements",
    body: "1. Summary row with one KPI per strand and a clear healthy / at-risk state.\n2. Trend chart for the selected strand with a 12-week window.\n3. Strand filter that keeps the URL shareable.\n4. Compact and comfortable density for wall displays and laptops.\n5. Light and dark themes.\n6. Loading, empty and error states for every widget.",
  },
  {
    id: "non-goals",
    heading: "Non-goals",
    body: "Editing source data, custom report building, and alerting. The first release is read-only.",
  },
  {
    id: "metrics",
    heading: "Success metrics",
    body: "Leadership can answer \"what needs attention?\" in under 60 seconds. Weekly status deck is retired within 6 weeks of launch.",
  },
  {
    id: "questions",
    heading: "Open questions",
    body: "Which source of truth wins when Pipeline and Delivery disagree? Do we need per-strand permissions in v1?",
  },
];

export interface PrototypeConfig {
  density: "comfortable" | "compact";
  theme: "light" | "dark";
  chart: "bars" | "line";
  accent: "teal" | "amber" | "blue";
  strand: "all" | "pipeline" | "delivery" | "health";
  trends: boolean;
}

export const PROTOTYPE_CONFIG_INITIAL: PrototypeConfig = {
  density: "comfortable",
  theme: "light",
  chart: "bars",
  accent: "teal",
  strand: "all",
  trends: true,
};

export interface PrototypeVersion {
  version: number;
  label: string;
  config: PrototypeConfig;
}

export const PROTOTYPE_VERSIONS_INITIAL: PrototypeVersion[] = [
  {
    version: 1,
    label: "First pass from the PRD",
    config: { ...PROTOTYPE_CONFIG_INITIAL, trends: false, chart: "bars" },
  },
  {
    version: 2,
    label: "Added trend chart and strand filter",
    config: PROTOTYPE_CONFIG_INITIAL,
  },
];
