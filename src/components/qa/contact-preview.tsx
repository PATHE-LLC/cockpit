"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  Loader2Icon,
  CheckIcon,
  MessageSquarePlusIcon,
  ShoppingBagIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQA } from "@/lib/qa/store";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DialogFooter } from "@/components/ui/dialog";

export function ContactSnapshot({
  build,
  annotation = false,
  expected = false,
}: {
  build: number;
  annotation?: boolean;
  expected?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-lg border bg-background p-5 text-foreground"
      aria-label={
        expected
          ? "Illustration of the agreed expected behavior"
          : `Demo captured contact form on build ${build}${annotation ? ", message field annotated" : ""}`
      }
    >
      <div className="mb-5 flex items-center justify-between border-b pb-3 text-xs">
        <span className="font-semibold tracking-[.15em]">FORME</span>
        <span className="text-muted-foreground">
          /contact ·{" "}
          {expected ? "Expected behavior" : build === 12 ? "Before" : "After"}
        </span>
      </div>
      <p className="font-medium">A little help?</p>
      <p className="mb-4 mt-1 text-xs text-muted-foreground">
        We’d love to hear from you.
      </p>
      <div className="mb-3 rounded-md border p-2 text-xs text-muted-foreground">
        shopper@example.test
      </div>
      <div className="relative min-h-20 rounded-md border p-2 text-xs">
        {build === 13 ? (
          "Hello, can you help with my order?"
        ) : (
          <span className="text-muted-foreground">Your message</span>
        )}
        {annotation && (
          <div className="pointer-events-none absolute inset-1 rounded-full border-2 border-destructive" />
        )}
      </div>
      <p className="mt-2 text-xs text-destructive-text">
        Couldn’t send. Please try again.
      </p>
      <div className="mt-3 inline-flex rounded-full bg-foreground px-4 py-2 text-xs text-background">
        Send message
      </div>
    </div>
  );
}

export function FormeStorefront({ build }: { build: number }) {
  const [message, setMessage] = useState("Hello, can you help with my order?");
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    void useQA.persist.rehydrate();
    const sync = (event: StorageEvent) => {
      if (event.key === "cockpit-qa-v1") void useQA.persist.rehydrate();
    };
    window.addEventListener("storage", sync);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-6 sm:py-10">
        <div className="mb-8 flex items-center justify-between gap-3">
          <a
            href="/qa"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ArrowLeftIcon aria-hidden />
            Back to QA
          </a>
          <p className="text-xs text-muted-foreground">
            Build {build} · Demo store
          </p>
        </div>
        <header className="flex items-center justify-between border-b pb-5">
          <span className="font-semibold tracking-[.15em]">FORME</span>
          <ShoppingBagIcon aria-label="Shopping bag" className="size-5" />
        </header>
        <main className="mx-auto flex max-w-sm flex-col gap-6 py-10 sm:py-16">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-medium tracking-tight">
              A little help?
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              An order question or just saying hello? We’re here.
            </p>
          </div>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSending(true);
              timer.current = setTimeout(() => {
                setFailed(true);
                setSending(false);
                if (build === 12) setMessage("");
              }, 650);
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="store-name">Name</Label>
              <Input
                id="store-name"
                defaultValue="Demo shopper"
                required
                disabled={sending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="store-email">Email</Label>
              <Input
                id="store-email"
                type="email"
                defaultValue="shopper@example.test"
                required
                disabled={sending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="store-message">Message</Label>
              <Textarea
                id="store-message"
                rows={4}
                placeholder="Your message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                disabled={sending}
              />
            </div>
            {failed && (
              <p role="alert" className="text-sm text-destructive-text">
                Couldn’t send. Please try again.
              </p>
            )}
            <Button
              type="submit"
              disabled={sending}
              className="w-full bg-foreground text-background hover:bg-foreground/90"
            >
              {sending && (
                <Loader2Icon aria-hidden className="motion-safe:animate-spin" />
              )}
              {sending ? "Sending…" : "Send message"}
            </Button>
          </form>
          <p className="text-xs leading-5 text-muted-foreground">
            This demo simulates a failed request. Nothing is sent.
          </p>
          {submitted ? (
            <div
              role="status"
              className="flex flex-col items-start gap-3 border-t pt-5"
            >
              <p className="flex items-center gap-2 text-sm">
                <CheckIcon aria-hidden className="size-4" />
                Feedback linked to QA-104
              </p>
              <a href="/qa" className={buttonVariants({ variant: "outline" })}>
                Review in QA
                <ExternalLinkIcon aria-hidden />
              </a>
            </div>
          ) : (
            failed && (
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => setReporting(true)}
              >
                <MessageSquarePlusIcon aria-hidden />
                Report an issue
              </Button>
            )
          )}
        </main>
      </div>
      <FeedbackDialog
        build={build}
        open={reporting}
        onOpenChange={setReporting}
        onSubmitted={() => {
          setSubmitted(true);
          setReporting(false);
          toast.success("Feedback linked to QA-104", {
            description: "The original build and capture are saved.",
          });
        }}
      />
      <Toaster />
    </div>
  );
}

function FeedbackDialog({
  build,
  open,
  onOpenChange,
  onSubmitted,
}: {
  build: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}) {
  const [annotation, setAnnotation] = useState(false);
  const [category, setCategory] = useState("Bug");
  const [description, setDescription] = useState(
    "My message disappears when sending fails.",
  );
  const [expected, setExpected] = useState("Keep my message so I can retry.");
  const [actual, setActual] = useState(
    build === 12
      ? "An error appears and the message field is empty."
      : "An error appears and my message stays in the form.",
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>Report an issue</DialogTitle>
          <DialogDescription>
            Build {build} · Contact form. Feedback is saved in QA.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            useQA.getState().capture({
              build,
              category,
              description,
              expected,
              actual,
              annotation,
              page: "/contact",
              device: "Desktop · Chrome · 1440 × 900",
            });
            onSubmitted();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="feedback-category">Category</Label>
            <Select
              items={[
                "Bug",
                "Visual polish",
                "Usability",
                "Feature request",
              ].map((value) => ({ value, label: value }))}
              value={category}
              onValueChange={(value) => {
                if (value) setCategory(value);
              }}
            >
              <SelectTrigger id="feedback-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {["Bug", "Visual polish", "Usability", "Feature request"].map(
                    (value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ),
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="feedback-description">What happened?</Label>
            <Textarea
              id="feedback-description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="feedback-expected">Expected</Label>
            <Input
              id="feedback-expected"
              required
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="feedback-actual">Actual</Label>
            <Input
              id="feedback-actual"
              required
              value={actual}
              onChange={(e) => setActual(e.target.value)}
            />
          </div>
          <Collapsible>
            <CollapsibleTrigger
              render={<Button type="button" variant="ghost" size="sm" />}
            >
              Review attached capture
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-col gap-3 py-3">
                <ContactSnapshot build={build} annotation={annotation} />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={annotation}
                    onCheckedChange={setAnnotation}
                  />
                  Circle the message field
                </label>
                <p className="text-xs text-muted-foreground">
                  Illustrative capture · /contact · Build {build}. Sample data
                  only.
                </p>
                <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs leading-5">
                  POST /contact → 503{"\n"}Submission failed: service
                  unavailable
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !description.trim() || !expected.trim() || !actual.trim()
              }
            >
              Submit feedback
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
