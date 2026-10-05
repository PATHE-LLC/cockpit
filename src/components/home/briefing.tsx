"use client";

import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BRIEFING, USER_NAME } from "@/lib/demo/tasks";
import { AudioSummary } from "./audio-summary";
import { MainPrompt } from "./main-prompt";
import { TaskChecklist } from "./task-checklist";

type Phase = "loading" | "ready" | "error";

function BriefingSkeleton() {
  return (
    <div role="status" aria-label="Preparing your briefing" className="flex flex-col gap-4">
      <Skeleton className="h-[60px] w-full rounded-2xl" />
      <div className="mt-2 flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-3 py-2">
            <Skeleton className="mt-1 size-5 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="mt-2 h-5 w-2/5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Preparing your briefing…</span>
    </div>
  );
}

function BriefingInner() {
  const params = useSearchParams();
  const router = useRouter();
  const forceError = params.get("demo") === "error";
  const [attempt, setAttempt] = useState(0);
  const [resolved, setResolved] = useState(-1);
  const phase: Phase = resolved !== attempt ? "loading" : forceError && attempt === 0 ? "error" : "ready";

  useEffect(() => {
    const id = window.setTimeout(() => setResolved(attempt), 650);
    return () => window.clearTimeout(id);
  }, [attempt]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-10 pb-16 sm:px-6 sm:pt-16">
      <h1 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
        Good morning, {USER_NAME}
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {phase === "ready" ? BRIEFING.headline + " from overnight." : "Getting your day ready…"}
      </p>

      <div className="mt-8">
        <MainPrompt />
      </div>

      <div className="mt-6 flex flex-col gap-5" aria-busy={phase === "loading"}>
        {phase === "loading" && <BriefingSkeleton />}
        {phase === "error" && (
          <div
            role="alert"
            className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangleIcon className="size-4 text-destructive" aria-hidden />
              Couldn&rsquo;t load your briefing
            </div>
            <p className="text-sm text-muted-foreground">
              Slack didn&rsquo;t respond in time, so the checklist may be stale. Nothing was changed. Try again.
            </p>
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
                Open all tasks
              </Button>
            </div>
          </div>
        )}
        {phase === "ready" && (
          <>
            <AudioSummary />
            <TaskChecklist />
            <div className="text-center">
              <Link
                href="/tasks"
                className="rounded-md px-2 py-1 text-sm font-medium text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                View all
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function Briefing() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-2xl px-4 pt-16"><BriefingSkeleton /></div>}>
      <BriefingInner />
    </Suspense>
  );
}
