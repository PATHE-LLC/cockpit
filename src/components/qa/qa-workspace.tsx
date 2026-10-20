"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  RotateCcwIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type QATab } from "@/lib/qa/model";
import { useQA } from "@/lib/qa/store";
import { ContactPreview } from "./contact-preview";
import { QAChat } from "./qa-chat";
import { Issues, ReleaseReview, Results, RunPlan } from "./qa-panels";

const titles: Record<QATab, string> = {
  plan: "Test plan",
  results: "Runs",
  issues: "Issues",
  release: "Release",
};
const subscribe = (change: () => void) => {
  const media = window.matchMedia("(min-width: 1024px)");
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
};
const desktopSnapshot = () => window.matchMedia("(min-width: 1024px)").matches;
export function QAWorkspace({ initialPrompt }: { initialPrompt?: string }) {
  const s = useQA();
  const [preview, setPreview] = useState(false);
  const [running, setRunning] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [chat, setChat] = useState(Boolean(initialPrompt));
  const desktop = useSyncExternalStore(subscribe, desktopSnapshot, () => true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatTrigger = useRef<HTMLButtonElement>(null);
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
    }, 1400);
  };
  const openIssues = s.issues.filter(
    (issue) => issue.status !== "resolved",
  ).length;
  const work = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div role="status" aria-live="polite">
        {running && (
          <div className="px-5 pt-4 sm:px-8">
            <Alert role="presentation">
              <Loader2Icon aria-hidden className="motion-safe:animate-spin" />
              <AlertTitle>Running checks on build {s.build}</AlertTitle>
              <AlertDescription>
                Local simulation · results preserve each attempt.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
      <TabsContent value="plan" className="flex min-h-0 flex-1 flex-col">
        <RunPlan running={running} onRun={onRun} />
      </TabsContent>
      <TabsContent value="results" className="flex min-h-0 flex-1 flex-col">
        <Results running={running} onRun={onRun} />
      </TabsContent>
      <TabsContent value="issues" className="flex min-h-0 flex-1 flex-col">
        <Issues openPreview={() => setPreview(true)} />
      </TabsContent>
      <TabsContent value="release" className="flex min-h-0 flex-1 flex-col">
        <ReleaseReview />
      </TabsContent>
    </div>
  );
  return (
    <Sheet open={chat && !desktop} onOpenChange={setChat}>
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              nativeButton={false}
              render={<Link href="/tasks" />}
              aria-label="Back to tasks"
              className="hidden sm:inline-flex"
            >
              <ArrowLeftIcon aria-hidden />
            </Button>
            <Avatar size="sm" className="hidden sm:flex">
              <AvatarFallback>F</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">Forme</span>
            <ChevronRightIcon
              aria-hidden
              className="size-3 text-muted-foreground"
            />
            <span className="text-sm text-muted-foreground">QA</span>
            <Badge variant="outline" className="hidden sm:inline-flex">
              Staging · b{s.build}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Open storefront"
              onClick={() => setPreview(true)}
            >
              <ExternalLinkIcon aria-hidden data-icon="inline-start" />
              <span className="hidden sm:inline">Storefront</span>
            </Button>
            <Button
              ref={chatTrigger}
              className="hidden lg:inline-flex"
              variant={chat ? "secondary" : "outline"}
              size="sm"
              aria-expanded={chat}
              onClick={() => setChat(!chat)}
            >
              <SparklesIcon aria-hidden data-icon="inline-start" />
              Ask Cockpit
            </Button>
            <SheetTrigger
              className="lg:hidden"
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Ask Cockpit"
                />
              }
            >
              <SparklesIcon aria-hidden />
            </SheetTrigger>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="QA options"
                  />
                }
              >
                <MoreHorizontalIcon aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    disabled={running}
                    onClick={() => setConfirmReset(true)}
                  >
                    <RotateCcwIcon aria-hidden />
                    Restart QA demo
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <Separator />
        <Tabs
          value={s.tab}
          onValueChange={(value) => s.setTab(value as QATab)}
          className="min-h-0 flex-1 gap-0"
        >
          <div className="flex shrink-0 items-center justify-between gap-4 overflow-x-auto px-3 py-3 sm:px-8">
            <TabsList aria-label="QA workspace">
              {(Object.keys(titles) as QATab[]).map((tab) => (
                <TabsTrigger value={tab} key={tab}>
                  {tab === "plan" ? (
                    <>
                      <span className="hidden sm:inline">Test plan</span>
                      <span className="sm:hidden">Plan</span>
                    </>
                  ) : (
                    titles[tab]
                  )}
                  {tab === "results" && s.runs.length > 0 && (
                    <span className="text-xs tabular-nums">
                      {s.runs.length}
                    </span>
                  )}
                  {tab === "issues" && openIssues > 0 && (
                    <span className="text-xs tabular-nums">{openIssues}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
              Local demo
            </span>
          </div>
          <Separator />
          {desktop ? (
            <ResizablePanelGroup
              orientation="horizontal"
              className="min-h-0 flex-1"
            >
              <ResizablePanel
                id="qa-work"
                defaultSize={chat ? "68%" : "100%"}
                minSize="52%"
                className="flex min-h-0 min-w-0 flex-col"
              >
                {work}
              </ResizablePanel>
              {chat && (
                <>
                  <ResizableHandle aria-label="Resize Cockpit assistant" />
                  <ResizablePanel
                    id="qa-assistant"
                    defaultSize="32%"
                    minSize="320px"
                    maxSize="48%"
                    className="flex min-h-0 min-w-0 flex-col"
                  >
                    <aside
                      aria-label="Cockpit assistant"
                      className="flex min-h-0 flex-1 flex-col"
                    >
                      <div className="flex items-start justify-between gap-3 px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <h2 className="text-sm font-medium">Cockpit</h2>
                          <p className="text-xs text-muted-foreground">
                            Forme · b{s.build} · {titles[s.tab]}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Close Cockpit assistant"
                          onClick={() => {
                            setChat(false);
                            chatTrigger.current?.focus();
                          }}
                        >
                          <XIcon aria-hidden />
                        </Button>
                      </div>
                      <Separator />
                      <QAChat initialPrompt={initialPrompt} />
                    </aside>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          ) : (
            work
          )}
        </Tabs>
        <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
          <DialogContent>
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
      <SheetContent className="data-[side=right]:w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Cockpit</SheetTitle>
          <SheetDescription>
            Forme · b{s.build} · {titles[s.tab]}
          </SheetDescription>
        </SheetHeader>
        <QAChat initialPrompt={initialPrompt} />
      </SheetContent>
    </Sheet>
  );
}
