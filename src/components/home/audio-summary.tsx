"use client";

import { ChevronDownIcon, PauseIcon, PlayIcon, Volume2Icon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BRIEFING } from "@/lib/demo/tasks";
import { cn } from "@/lib/utils";

const BARS = Array.from({ length: 36 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function AudioSummary() {
  const lines = BRIEFING.transcript;
  const offsets = useMemo(() => {
    const weights = lines.map((l) => l.length);
    const total = weights.reduce((a, b) => a + b, 0);
    return weights.map(
      (_, i) => (weights.slice(0, i).reduce((a, b) => a + b, 0) / total) * BRIEFING.durationSeconds,
    );
  }, [lines]);

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [open, setOpen] = useState(false);
  const elapsedRef = useRef(0);

  const lineAt = useCallback(
    (t: number) => {
      let idx = 0;
      offsets.forEach((o, i) => {
        if (t >= o) idx = i;
      });
      return idx;
    },
    [offsets],
  );

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const speakFrom = useCallback(
    (index: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      lines.slice(index).forEach((line, i) => {
        const u = new SpeechSynthesisUtterance(line);
        u.rate = 1.02;
        u.onstart = () => {
          elapsedRef.current = offsets[index + i];
        };
        synth.speak(u);
      });
    },
    [lines, offsets],
  );

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      elapsedRef.current = Math.min(BRIEFING.durationSeconds, elapsedRef.current + 0.25);
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= BRIEFING.durationSeconds) {
        setPlaying(false);
        stopSpeech();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [playing, stopSpeech]);

  useEffect(() => stopSpeech, [stopSpeech]);

  const toggle = () => {
    if (playing) {
      stopSpeech();
      setPlaying(false);
      return;
    }
    if (elapsedRef.current >= BRIEFING.durationSeconds) {
      elapsedRef.current = 0;
      setElapsed(0);
    }
    speakFrom(lineAt(elapsedRef.current));
    setPlaying(true);
  };

  const progress = elapsed / BRIEFING.durationSeconds;
  const current = lineAt(elapsed);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-2xl border bg-card">
      <div className="flex items-center gap-3 p-3 sm:p-3.5">
        <Button
          size="icon"
          variant="default"
          className="size-9 shrink-0 rounded-full"
          onClick={toggle}
          aria-label={playing ? "Pause audio summary" : "Play audio summary"}
        >
          {playing ? <PauseIcon className="size-4" aria-hidden /> : <PlayIcon className="size-4" aria-hidden />}
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-medium">Audio summary</p>
            <p className="tabular text-xs text-muted-foreground" aria-live="off">
              {fmt(elapsed)} / {fmt(BRIEFING.durationSeconds)}
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="Audio summary progress"
            aria-valuemin={0}
            aria-valuemax={BRIEFING.durationSeconds}
            aria-valuenow={Math.round(elapsed)}
            className="mt-1.5 flex h-6 items-center gap-[2px]"
          >
            {BARS.map((h, i) => {
              const done = i / BARS.length < progress;
              return (
                <span
                  key={i}
                  aria-hidden
                  className={cn(
                    "w-full origin-center rounded-full transition-colors duration-200",
                    done ? "bg-brand" : "bg-border",
                    playing && "motion-safe:animate-[bar_1.1s_ease-in-out_infinite]",
                  )}
                  style={{
                    height: `${h * 100}%`,
                    animationDelay: `${(i % 9) * 70}ms`,
                  }}
                />
              );
            })}
          </div>
        </div>
        <CollapsibleTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label={open ? "Hide transcript" : "Show transcript"} />}
        >
          <ChevronDownIcon
            className={cn("size-4 transition-transform duration-200 ease-out-strong motion-reduce:transition-none", open && "rotate-180")}
            aria-hidden
          />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="border-t px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Volume2Icon className="size-3.5" aria-hidden /> Transcript
          </p>
          <ol className="flex flex-col gap-1.5 text-sm">
            {lines.map((l, i) => (
              <li
                key={l}
                className={cn(
                  "transition-colors duration-200",
                  playing && i === current ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {l.replace(/R L S/g, "RLS").replace(/P R D/g, "PRD")}
              </li>
            ))}
          </ol>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
