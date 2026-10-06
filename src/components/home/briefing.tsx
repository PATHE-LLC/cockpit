"use client";

import { AlertTriangleIcon, RefreshCwIcon, SunIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { USER_NAME } from "@/lib/demo/tasks";
import { AudioSummary } from "./audio-summary";
import { MainPrompt } from "./main-prompt";
import { TaskChecklist } from "./task-checklist";

type Phase = "loading" | "ready" | "error";

function HomeSkeleton() {
  return (
    <div role="status" aria-label="Loading checklist" className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="size-5 rounded-md" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      ))}
      <span className="sr-only">Loading checklist</span>
    </div>
  );
}

function Forecast() {
  const [time, setTime] = useState("9:56 AM");

  useEffect(() => {
    const format = () =>
      new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setTime(format());
    const id = window.setInterval(() => setTime(format()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex shrink-0 items-end gap-3 whitespace-nowrap text-sm leading-none">
      <p className="text-muted-foreground tabular-nums">{time}</p>
      <p className="flex items-end gap-1.5">
        <SunIcon className="size-4 shrink-0 -translate-y-px text-amber-500" aria-hidden />
        <span className="font-medium">40°C</span>
        <span className="text-muted-foreground">Clear</span>
      </p>
    </div>
  );
}

function HomeInner() {
  const params = useSearchParams();
  const router = useRouter();
  const forceError = params.get("demo") === "error";
  const [attempt, setAttempt] = useState(0);
  const [resolved, setResolved] = useState(-1);
  const phase: Phase = resolved !== attempt ? "loading" : forceError && attempt === 0 ? "error" : "ready";

  useEffect(() => {
    const id = window.setTimeout(() => setResolved(attempt), 400);
    return () => window.clearTimeout(id);
  }, [attempt]);

  return (
    <div className="page-column pt-16 pb-16 sm:pt-24">
      <div className="flex items-baseline justify-between gap-6" data-tour="greeting">
        <h1 className="min-w-0 text-3xl font-semibold tracking-tight sm:text-4xl">
          Good morning, <span className="text-muted-foreground">{USER_NAME}</span>
        </h1>
        <Forecast />
      </div>

      <div className="mt-8">
        <MainPrompt />
      </div>

      <div className="mt-6">
        <AudioSummary />
      </div>

      <div className="mt-6" aria-busy={phase === "loading"}>
        {phase === "loading" && <HomeSkeleton />}
        {phase === "error" && (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangleIcon className="size-4 text-destructive" aria-hidden />
              Couldn&rsquo;t load the checklist
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  router.replace("/");
                  setAttempt((a) => a + 1);
                }}
              >
                <RefreshCwIcon aria-hidden /> Retry
              </Button>
              <Button size="sm" variant="ghost" nativeButton={false} render={<Link href="/tasks" />}>
                All tasks
              </Button>
            </div>
          </div>
        )}
        {phase === "ready" && <TaskChecklist compact />}
      </div>
    </div>
  );
}

export function Briefing() {
  return (
    <div className="edge-scroll min-h-0 flex-1 overflow-y-auto" data-tour="home">
      <Suspense fallback={<div className="page-column pt-16"><HomeSkeleton /></div>}>
        <HomeInner />
      </Suspense>
    </div>
  );
}
