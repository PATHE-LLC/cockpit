"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckIcon,
  CircleDashedIcon,
  ExternalLinkIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHECKS, type QATab } from "@/lib/qa/model";
import { useQA } from "@/lib/qa/store";
import { isQATourActive } from "@/lib/qa/tour";
import { cn } from "cn";
import { ReleaseReview, Results, RunPlan } from "./qa-panels";

export function QAWorkspace() {
  const s = useQA();
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<{
    ids: string[];
    completed: number;
    build: number;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const running = progress !== null;
  useEffect(() => {
    Promise.resolve(useQA.persist.rehydrate()).then(() => setReady(true));
    const sync = (event: StorageEvent) => {
      if (event.key === "cockpit-qa-v1" && !isQATourActive())
        void useQA.persist.rehydrate();
    };
    window.addEventListener("storage", sync);
    return () => {
      if (timer.current) clearInterval(timer.current);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const onRun = () => {
    if (timer.current) return;
    const { build, scope, selected, inbox } = useQA.getState();
    if (!selected.length) return;
    const plan = { build, scope, selected: [...selected], inbox };
    let completed = 0;
    s.setTab("results");
    setProgress({ ids: plan.selected, completed, build });
    timer.current = setInterval(() => {
      completed += 1;
      if (completed < plan.selected.length) {
        setProgress({ ids: plan.selected, completed, build });
        return;
      }
      clearInterval(timer.current!);
      timer.current = null;
      useQA.getState().run(plan);
      setProgress(null);
      const run = useQA.getState().runs.at(-1)!;
      const failed = run.results.filter(
        (result) => result.outcome === "failed",
      ).length;
      toast.success(`Run ${run.id} complete`, {
        description: failed
          ? `${failed} failed check needs attention.`
          : "Your results are ready to review.",
      });
    }, 420);
  };
  const activeTab = s.tab === "issues" ? "results" : s.tab;
  const expanded =
    activeTab === "results" && (s.evidenceOpen || s.tab === "issues");
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div
        data-tour="qa-overview"
        className={cn(
          "mx-auto w-full shrink-0 px-6 pb-6 pt-8 sm:pt-12 motion-safe:transition-[max-width] motion-safe:duration-200",
          expanded ? "max-w-[1440px]" : "max-w-3xl",
        )}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Forme QA</h1>
            <p className="text-xs text-muted-foreground">
              Staging · Build {s.build}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={`/preview/forme?build=${s.build}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <span className="hidden sm:inline">Open preview</span>
              <ExternalLinkIcon aria-hidden />
              <span className="sr-only sm:hidden">
                Open preview in a new tab
              </span>
            </a>
          </div>
        </header>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => s.setTab(value as QATab)}
        className="min-h-0 flex-1 gap-0"
      >
        <div
          className={cn(
            "mx-auto w-full shrink-0 px-6 pb-6 motion-safe:transition-[max-width] motion-safe:duration-200",
            expanded ? "max-w-[1440px]" : "max-w-3xl",
          )}
        >
          <TabsList aria-label="QA workspace">
            <TabsTrigger value="plan">Checks</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="release">Release</TabsTrigger>
          </TabsList>
        </div>
        {!ready ? (
          <div
            className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-6"
            aria-label="Loading QA"
            role="status"
          >
            <Skeleton className="h-6 w-40" />
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
            <span className="sr-only">Loading your QA workspace…</span>
          </div>
        ) : (
          <>
            <TabsContent value="plan" className="flex min-h-0 flex-1 flex-col">
              <RunPlan running={running} onRun={onRun} />
            </TabsContent>
            <TabsContent
              value="results"
              className="flex min-h-0 flex-1 flex-col"
            >
              {progress ? (
                <RunProgress {...progress} />
              ) : (
                <Results running={running} onRun={onRun} />
              )}
            </TabsContent>
            <TabsContent
              value="release"
              className="flex min-h-0 flex-1 flex-col"
            >
              <ReleaseReview />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function RunProgress({
  ids,
  completed,
  build,
}: {
  ids: string[];
  completed: number;
  build: number;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div
        className="mx-auto flex max-w-3xl flex-col gap-6 px-6 pb-12"
        aria-busy="true"
      >
        <div className="flex flex-col gap-2" role="status" aria-live="polite">
          <h2 className="text-lg font-medium">Running {ids.length} checks</h2>
          <p className="text-sm text-muted-foreground">
            Build {build} · {completed} of {ids.length} complete
          </p>
        </div>
        <Progress value={(completed / ids.length) * 100}>
          <ProgressLabel className="sr-only">Test run progress</ProgressLabel>
        </Progress>
        <ul className="flex flex-col divide-y">
          {ids.map((id, i) => (
            <li key={id} className="flex items-center gap-3 py-4 text-sm">
              {i < completed ? (
                <CheckIcon aria-hidden className="size-4" />
              ) : i === completed ? (
                <Loader2Icon
                  aria-hidden
                  className="size-4 motion-safe:animate-spin"
                />
              ) : (
                <CircleDashedIcon
                  aria-hidden
                  className="size-4 text-muted-foreground"
                />
              )}
              <span className="flex-1">
                {CHECKS.find((check) => check.id === id)?.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {i < completed
                  ? "Complete"
                  : i === completed
                    ? "Running"
                    : "Waiting"}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Demo run · no live tests are executed.
        </p>
      </div>
    </div>
  );
}
