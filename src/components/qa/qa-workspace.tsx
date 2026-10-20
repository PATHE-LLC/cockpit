"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  FlaskConicalIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  RotateCcwIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { latestResults, type QATab } from "@/lib/qa/model";
import { useQA } from "@/lib/qa/store";
import { cn } from "@/lib/utils";
import { ContactPreview } from "./contact-preview";
import { QAChat } from "./qa-chat";
import { Issues, ReleaseReview, Results, RunPlan } from "./qa-panels";
import "./qa.css";

const TITLES: Record<QATab, string> = {
  plan: "Test plan",
  results: "Results",
  issues: "Issues",
  release: "Release review",
};

export function QAWorkspace({ initialPrompt }: { initialPrompt?: string }) {
  const s = useQA();
  const [preview, setPreview] = useState(false);
  const [running, setRunning] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [chat, setChat] = useState(Boolean(initialPrompt));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    void useQA.persist.rehydrate();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  const onRun = () => {
    if (running) return;
    const { build, scope, selected, inbox } = useQA.getState();
    if (!selected.length) return;
    const plan = { build, scope, selected: [...selected], inbox };
    setRunning(true);
    timer.current = setTimeout(() => {
      useQA.getState().run(plan);
      setRunning(false);
    }, 1100);
  };
  const openIssues = s.issues.filter(
    (issue) => issue.status !== "resolved",
  ).length;
  const evidence = latestResults(s.runs, s.build);
  const stale = [...evidence.values()].filter((item) => item.stale).length;
  const status =
    s.decision?.kind === "approved"
      ? "Release approved"
      : s.decision?.kind === "held"
        ? "Release held"
        : stale
          ? "Retest needed"
          : openIssues
            ? "Needs attention"
            : s.runs.length
              ? "Review results"
              : "Ready to test";
  return (
    <div className="qa-surface relative flex min-h-0 flex-1 flex-col bg-background">
      <header className="shrink-0 border-b px-4 sm:px-8">
        <div className="mx-auto flex min-h-16 max-w-[1160px] flex-wrap items-center justify-between gap-2 py-3">
          <div className="flex min-w-0 items-center gap-2.5 text-xs">
            <Link
              href="/tasks"
              aria-label="Back to tasks"
              className="qa-back grid size-9 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand"
            >
              <ArrowLeftIcon aria-hidden className="size-4" />
            </Link>
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-foreground text-xs font-medium text-background">
              F
            </span>
            <span className="font-medium">Forme</span>
            <ChevronRightIcon
              aria-hidden
              className="hidden size-3 text-muted-foreground sm:block"
            />
            <span className="hidden text-muted-foreground sm:inline">
              Build & QA
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="mr-2 hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <span className="size-1.5 rounded-full bg-brand" />
              Staging{" "}
              <span className="ml-1 font-mono text-[11px]">b{s.build}</span>
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreview(true)}
            >
              <span className="hidden sm:inline">Open storefront</span>
              <span className="sm:hidden">Preview</span>
              <ExternalLinkIcon aria-hidden />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="QA options" />
                }
              >
                <MoreHorizontalIcon aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={running}
                  onClick={() => setConfirmReset(true)}
                >
                  <RotateCcwIcon aria-hidden />
                  Restart QA demo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <Tabs
        value={s.tab}
        onValueChange={(value) => s.setTab(value as QATab)}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="shrink-0 border-b px-5 pt-7 sm:px-10">
          <div className="mx-auto max-w-[1080px]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FlaskConicalIcon
                  aria-hidden
                  className="size-5 text-muted-foreground"
                />
                <h1 className="text-xl font-semibold tracking-tight">
                  Quality review
                </h1>
              </div>
              <span
                className={cn(
                  "flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-[11px]",
                  (openIssues || stale) && "bg-warn-soft/70",
                  s.decision?.kind === "approved" && "bg-brand-soft text-brand",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-full bg-muted-foreground",
                    (openIssues || stale) && "bg-warn",
                    s.decision?.kind === "approved" && "bg-brand",
                  )}
                />
                {status}
              </span>
            </div>
            <div className="overflow-x-auto">
              <TabsList
                variant="line"
                aria-label="QA workflow"
                className="h-11 gap-5 p-0 sm:gap-7"
              >
                {(Object.keys(TITLES) as QATab[]).map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="qa-tab h-11 flex-none gap-2 rounded-none px-0 text-xs font-medium after:bottom-0 sm:text-sm"
                  >
                    {TITLES[tab]}
                    {tab === "results" && s.runs.length > 0 && (
                      <span className="qa-count">
                        {s.runs.find((r) => r.id === s.activeRun)?.results
                          .length ?? s.runs.at(-1)?.results.length}
                      </span>
                    )}
                    {tab === "issues" && openIssues > 0 && (
                      <span className="qa-count">{openIssues}</span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
        </div>
        <div
          key={s.tab}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          aria-busy={running}
        >
          <div className="mx-auto w-full max-w-[1160px] px-5 pb-28 pt-8 sm:px-10 sm:pt-10">
            {running && (
              <div
                role="status"
                className="mb-6 flex items-center gap-3 rounded-lg bg-brand-soft/60 px-4 py-3 text-sm"
              >
                <Loader2Icon
                  aria-hidden
                  className="size-4 text-brand motion-safe:animate-spin"
                />
                Running checks on build {s.build}…
                <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
                  Local simulation
                </span>
              </div>
            )}
            <TabsContent value="plan">
              <RunPlan running={running} onRun={onRun} />
            </TabsContent>
            <TabsContent value="results">
              <Results running={running} onRun={onRun} />
            </TabsContent>
            <TabsContent value="issues">
              <Issues openPreview={() => setPreview(true)} />
            </TabsContent>
            <TabsContent value="release">
              <ReleaseReview />
            </TabsContent>
          </div>
        </div>
      </Tabs>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-5 pt-8">
        <Popover open={chat} onOpenChange={setChat}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className="qa-chat-trigger pointer-events-auto h-12 w-full max-w-[420px] justify-start gap-3 border-border bg-background px-4 text-xs text-muted-foreground shadow-sm"
              />
            }
          >
            <SparklesIcon aria-hidden className="size-4 text-brand" />
            Ask Cockpit about this review
            <span className="ml-auto grid size-6 place-items-center rounded-md bg-muted">
              <ArrowUpRightIcon aria-hidden className="size-3.5" />
            </span>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            sideOffset={12}
            className="qa-surface qa-chat-panel h-[min(580px,70dvh)] w-[min(460px,calc(100vw-6rem))] gap-0 overflow-hidden rounded-2xl p-0"
            initialFocus={() => document.getElementById("qa-chat")}
          >
            <div className="flex items-start justify-between border-b px-5 py-4">
              <div>
                <PopoverTitle className="text-sm font-medium">
                  Ask Cockpit
                </PopoverTitle>
                <PopoverDescription className="mt-1 text-[11px]">
                  Forme · Build {s.build} · {TITLES[s.tab]}
                </PopoverDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close QA chat"
                onClick={() => setChat(false)}
              >
                <XIcon aria-hidden />
              </Button>
            </div>
            <QAChat initialPrompt={initialPrompt} />
          </PopoverContent>
        </Popover>
      </div>
      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent className="qa-surface">
          <DialogHeader>
            <DialogTitle>Restart the QA demo?</DialogTitle>
            <DialogDescription>
              This clears local QA runs, feedback and decisions and returns to
              build 12. Your other Cockpit work stays in place.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              className="qa-primary"
              onClick={() => {
                s.reset();
                setConfirmReset(false);
              }}
            >
              Restart demo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ContactPreview
        key={`${preview}-${s.build}`}
        open={preview}
        onOpenChange={setPreview}
      />
    </div>
  );
}
