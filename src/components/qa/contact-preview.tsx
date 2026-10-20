"use client";

import { useState } from "react";
import {
  ArrowLeftIcon,
  CheckIcon,
  MessageSquarePlusIcon,
  ShoppingBagIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <p className="mt-2 text-xs text-destructive">
        Couldn’t send. Please try again.
      </p>
      <div className="mt-3 inline-flex rounded-full bg-foreground px-4 py-2 text-xs text-background">
        Send message
      </div>
    </div>
  );
}

export function ContactPreview({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const build = useQA((s) => s.build);
  const capture = useQA((s) => s.capture);
  const [message, setMessage] = useState("Hello, can you help with my order?");
  const [failed, setFailed] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [annotation, setAnnotation] = useState(false);
  const [category, setCategory] = useState("Bug");
  const [description, setDescription] = useState(
    "My message disappears when sending fails.",
  );
  const [expected, setExpected] = useState("Keep my message so I can retry.");
  const [actual, setActual] = useState(
    "An error appears and the message field is empty.",
  );
  const [submitted, setSubmitted] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto overscroll-contain rounded-2xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {reporting ? "Report an issue" : "Storefront preview"}
          </DialogTitle>
          <DialogDescription>
            Forme ecommerce · Build {build} · Interactive demo. Nothing is sent.
          </DialogDescription>
        </DialogHeader>
        {submitted ? (
          <div className="py-8 text-center">
            <CheckIcon className="mx-auto mb-3 size-7 text-brand" />
            <h2 className="font-medium">Feedback linked to QA-104</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The capture and original build are preserved in the issue.
            </p>
            <Button className="mt-5" onClick={() => onOpenChange(false)}>
              View linked issue
            </Button>
          </div>
        ) : reporting ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              capture({
                build,
                category,
                description,
                expected,
                actual,
                annotation,
                page: "/contact",
                device: "Desktop · Chrome · 1440 × 900",
              });
              setSubmitted(true);
            }}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <ContactSnapshot build={build} annotation={annotation} />
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={annotation}
                    onChange={(e) => setAnnotation(e.target.checked)}
                  />
                  Circle the message field
                </label>
                <p className="mt-3 text-xs text-muted-foreground">
                  Demo capture · /contact · Chrome · 1440 × 900 · build {build}.
                  Sample data only; no personal data or credentials attached.
                </p>
                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer">
                    Attached console context
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3">
                    POST /contact → 503{"\n"}Submission failed: service
                    unavailable
                  </pre>
                </details>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="feedback-category">Category</Label>
                  <select
                    id="feedback-category"
                    className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {[
                      "Bug",
                      "Visual polish",
                      "Usability",
                      "Feature request",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="feedback-description">What happened?</Label>
                  <Textarea
                    id="feedback-description"
                    className="mt-2"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="feedback-expected">Expected</Label>
                  <Input
                    id="feedback-expected"
                    className="mt-2"
                    required
                    value={expected}
                    onChange={(e) => setExpected(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="feedback-actual">Actual</Label>
                  <Input
                    id="feedback-actual"
                    className="mt-2"
                    required
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Link to existing issue{" "}
                  <span className="font-medium text-foreground">QA-104</span> ·
                  Cockpit tracker
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setReporting(false)}
              >
                <ArrowLeftIcon />
                Back to preview
              </Button>
              <Button
                type="submit"
                disabled={
                  !description.trim() || !expected.trim() || !actual.trim()
                }
              >
                Submit feedback
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border bg-background p-6 sm:p-9">
            <header className="flex items-center justify-between border-b pb-5">
              <span className="font-semibold tracking-[.2em]">FORME</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                Everyday things, thoughtfully made.
                <ShoppingBagIcon className="size-4" />
              </span>
            </header>
            <div className="mx-auto max-w-sm py-8">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Get in touch
              </p>
              <h2 className="mt-2 text-3xl font-medium tracking-tight">
                A little help?
              </h2>
              <p className="mb-6 mt-3 text-sm text-muted-foreground">
                An order question or just saying hello? We’re here.
              </p>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setFailed(true);
                  if (build === 12) setMessage("");
                }}
              >
                <div>
                  <Label htmlFor="store-name">Name</Label>
                  <Input
                    id="store-name"
                    className="mt-2"
                    defaultValue="Demo shopper"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="store-email">Email</Label>
                  <Input
                    id="store-email"
                    type="email"
                    className="mt-2"
                    defaultValue="shopper@example.test"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="store-message">Message</Label>
                  <Textarea
                    id="store-message"
                    className="mt-2 min-h-24"
                    placeholder="Your message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                {failed && (
                  <p role="alert" className="text-sm text-destructive">
                    Couldn’t send. Please try again.
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                >
                  Send message
                </Button>
              </form>
              <p className="mt-3 text-xs text-muted-foreground">
                Demo connection is offline to reproduce the failure.
              </p>
            </div>
            {failed && build === 12 ? (
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setReporting(true)}>
                  <MessageSquarePlusIcon />
                  Report this issue
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {build === 13
                  ? "Build 13 keeps the message after a failed submission."
                  : "Submit the form to reproduce the bug, then report it here."}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
