"use client";

import {
  CheckCircle2Icon,
  CopyIcon,
  EyeIcon,
  HashIcon,
  MailIcon,
  PencilIcon,
  RefreshCwIcon,
  SendHorizonalIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RLS_CITATIONS } from "@/lib/demo/content";
import { playCue } from "@/lib/sounds";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CitedText } from "./cited-text";

export function DraftFrame({
  icon,
  label,
  meta,
  children,
  footer,
  className,
  flat = false,
}: {
  icon: React.ReactNode;
  label: string;
  meta?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  flat?: boolean;
}) {
  return (
    <div className={cn("my-3", className)}>
      {!flat && (
        <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden>{icon}</span>
          <span className="font-medium text-foreground">{label}</span>
          {meta && <span className="truncate">· {meta}</span>}
        </p>
      )}
      {children}
      {footer && <div className="mt-3 flex w-full flex-wrap items-center gap-2">{footer}</div>}
    </div>
  );
}

export function SupersededNote({ label }: { label: string }) {
  return (
    <p className="my-2 text-xs text-muted-foreground">
      Earlier {label} · replaced by the newer version below.
    </p>
  );
}

const messageSurface =
  "rounded-xl border-0 bg-muted px-3.5 py-3 text-sm leading-relaxed text-foreground shadow-none focus-visible:border-transparent focus-visible:ring-0";

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Couldn’t copy. Select the text and copy it manually.");
  }
}

export function SlackDraftCard({ rev, flat = false }: { rev: number; flat?: boolean }) {
  const { draft, rev: current, sent } = useCockpit((s) => s.slack);
  const setDraft = useCockpit((s) => s.setSlackDraft);
  const send = useCockpit((s) => s.sendSlack);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  if (rev < current) return <SupersededNote label="Slack draft" />;

  return (
    <DraftFrame
      flat={flat}
      icon={<HashIcon className="size-3.5" />}
      label="Slack reply"
      meta="#eng-backend · in Glenn’s thread"
      footer={
        sent ? (
          <p className="flex items-center gap-1.5 text-sm text-brand" role="status">
            <CheckCircle2Icon className="size-4" aria-hidden /> Posted to #eng-backend
          </p>
        ) : (
          <>
            <ToggleGroup
              value={[mode]}
              onValueChange={(v) => v[0] && setMode(v[0] as "edit" | "preview")}
              variant="default"
              size="sm"
              spacing={0}
              aria-label="Draft view"
            >
              <ToggleGroupItem value="edit" aria-label="Edit draft">
                <PencilIcon aria-hidden /> Edit
              </ToggleGroupItem>
              <ToggleGroupItem value="preview" aria-label="Preview with citations">
                <EyeIcon aria-hidden /> Preview
              </ToggleGroupItem>
            </ToggleGroup>
            <Button size="sm" variant="ghost" onClick={() => copy(draft)}>
              <CopyIcon aria-hidden /> Copy
            </Button>
            <Button
              size="sm"
              className="ml-auto"
              onClick={() => {
                send();
                playCue("send");
                toast.success("Reply posted to #eng-backend", { description: "Simulated. Nothing left this prototype." });
              }}
              disabled={!draft.trim()}
            >
              <SendHorizonalIcon aria-hidden /> Send to #eng-backend
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <div className={messageSurface}>
          <CitedText text={draft} citations={RLS_CITATIONS} />
        </div>
      ) : mode === "edit" ? (
        <>
          <Label htmlFor="slack-draft" className="sr-only">
            Slack reply draft
          </Label>
          <Textarea
            id="slack-draft"
            name="slack-draft"
            autoComplete="off"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={cn(messageSurface, "min-h-44 resize-y")}
          />
        </>
      ) : (
        <div className={messageSurface}>
          <CitedText text={draft} citations={RLS_CITATIONS} />
        </div>
      )}
    </DraftFrame>
  );
}

export function EmailDraftCard({ rev, flat = false }: { rev: number; flat?: boolean }) {
  const email = useCockpit((s) => s.email);
  const setField = useCockpit((s) => s.setEmailField);
  const setAnswers = useCockpit((s) => s.setEmailAnswers);
  const send = useCockpit((s) => s.sendEmail);

  if (rev < email.rev) return <SupersededNote label="email draft" />;

  return (
    <DraftFrame
      flat={flat}
      icon={<MailIcon className="size-3.5" />}
      label="Email draft"
      meta="to Alyssa Chen"
      footer={
        email.sent ? (
          <p className="flex items-center gap-1.5 text-sm text-brand" role="status">
            <CheckCircle2Icon className="size-4" aria-hidden /> Sent to Alyssa
          </p>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={() => copy(`Subject: ${email.draft.subject}\n\n${email.draft.body}`)}>
              <CopyIcon aria-hidden /> Copy
            </Button>
            {email.edited && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAnswers({}, true);
                  toast.success("Draft regenerated from your answers");
                }}
              >
                <RefreshCwIcon aria-hidden /> Regenerate
              </Button>
            )}
            <Button
              size="sm"
              className="ml-auto"
              onClick={() => {
                send();
                playCue("send");
                toast.success("Email sent to Alyssa", { description: "Simulated. Nothing left this prototype." });
              }}
              disabled={!email.draft.body.trim() || !email.draft.to.trim()}
            >
              <SendHorizonalIcon aria-hidden /> Send email
            </Button>
          </>
        )
      }
    >
      <div className="grid gap-2.5">
        <div className="grid grid-cols-[3.5rem_1fr] items-center gap-2">
          <Label htmlFor="email-to" className="text-xs text-muted-foreground">To</Label>
          <Input
            id="email-to"
            name="email-to"
            type="email"
            autoComplete="off"
            spellCheck={false}
            value={email.draft.to}
            onChange={(e) => setField("to", e.target.value)}
            disabled={email.sent}
            className="h-8 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          <Label htmlFor="email-subject" className="text-xs text-muted-foreground">Subject</Label>
          <Input
            id="email-subject"
            name="email-subject"
            autoComplete="off"
            value={email.draft.subject}
            onChange={(e) => setField("subject", e.target.value)}
            disabled={email.sent}
            className="h-8 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <Label htmlFor="email-body" className="sr-only">Email body</Label>
        <Textarea
          id="email-body"
          name="email-body"
          autoComplete="off"
          value={email.draft.body}
          onChange={(e) => setField("body", e.target.value)}
          disabled={email.sent}
          className={cn(messageSurface, "min-h-72 resize-y")}
        />
        {email.edited && !email.sent && (
          <p className="text-xs text-muted-foreground">
            You&rsquo;ve edited the body, so answers and tone changes won&rsquo;t overwrite it. Use Regenerate to rebuild it.
          </p>
        )}
      </div>
    </DraftFrame>
  );
}

export function EmailQuestionsCard() {
  const email = useCockpit((s) => s.email);
  const setAnswers = useCockpit((s) => s.setEmailAnswers);

  const depositValue = email.deposit === null ? "unsure" : email.deposit ? "yes" : "no";

  return (
    <DraftFrame icon={<PencilIcon className="size-3.5" />} label="Questions">
      <div className="grid gap-4">
        <fieldset className="grid gap-1.5">
          <legend className="text-sm font-medium">Does the client need a deposit when a customer accepts a quote?</legend>
          <ToggleGroup
            value={[depositValue]}
            onValueChange={(v) => {
              if (!v[0]) return;
              const applied = setAnswers({ deposit: v[0] === "unsure" ? null : v[0] === "yes" });
              if (!applied) toast("Answer saved", { description: "Your manual edits to the body are kept. Use Regenerate to apply." });
            }}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="Deposit on acceptance"
          >
            <ToggleGroupItem value="yes">Yes</ToggleGroupItem>
            <ToggleGroupItem value="no">No</ToggleGroupItem>
            <ToggleGroupItem value="unsure">Not sure yet</ToggleGroupItem>
          </ToggleGroup>
        </fieldset>
        <fieldset className="grid gap-1.5">
          <legend className="text-sm font-medium">How formal is your relationship with Alyssa?</legend>
          <ToggleGroup
            value={[email.tone]}
            onValueChange={(v) => {
              if (!v[0]) return;
              const applied = setAnswers({ tone: v[0] as "friendly" | "formal" });
              if (!applied) toast("Answer saved", { description: "Your manual edits to the body are kept. Use Regenerate to apply." });
            }}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="Email tone"
          >
            <ToggleGroupItem value="friendly">Friendly</ToggleGroupItem>
            <ToggleGroupItem value="formal">Formal</ToggleGroupItem>
          </ToggleGroup>
        </fieldset>
      </div>
    </DraftFrame>
  );
}

export function CodeReplyCard({ rev, flat = false }: { rev: number; flat?: boolean }) {
  const { reply, replySent, rev: current } = useCockpit((s) => s.code);
  const setReply = useCockpit((s) => s.setReply);
  const send = useCockpit((s) => s.sendReply);
  const approval = useCockpit((s) => s.code.approval);

  if (rev < current) return <SupersededNote label="reply" />;

  return (
    <DraftFrame
      flat={flat}
      icon={<HashIcon className="size-3.5" />}
      label="Reply to Dana"
      meta="Asana · Model 6D backlog"
      footer={
        replySent ? (
          <p className="flex items-center gap-1.5 text-sm text-brand" role="status">
            <CheckCircle2Icon className="size-4" aria-hidden /> Reply sent
            {approval !== "approved" && <span className="text-muted-foreground">· branch still not pushed</span>}
          </p>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={() => copy(reply)}>
              <CopyIcon aria-hidden /> Copy
            </Button>
            <Button
              size="sm"
              className="ml-auto"
              onClick={() => {
                send();
                playCue("send");
                toast.success("Reply sent to Dana", { description: "Simulated. Nothing left this prototype." });
              }}
              disabled={!reply.trim()}
            >
              <SendHorizonalIcon aria-hidden /> Send reply
            </Button>
          </>
        )
      }
    >
      <Label htmlFor="code-reply" className="sr-only">Reply to Dana</Label>
      <Textarea
        id="code-reply"
        name="code-reply"
        autoComplete="off"
        value={reply}
        disabled={replySent}
        onChange={(e) => setReply(e.target.value)}
        className={cn(messageSurface, "min-h-32 resize-y")}
      />
    </DraftFrame>
  );
}
