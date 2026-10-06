"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BRIEFING } from "@/lib/demo/tasks";
import { cn } from "@/lib/utils";

const BARS = Array.from({ length: 36 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function TransportIcon({ playing }: { playing: boolean }) {
  if (playing) {
    return (
      <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
        <rect x="5" y="3.5" width="4.75" height="17" rx="1.6" />
        <rect x="14.25" y="3.5" width="4.75" height="17" rx="1.6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="ml-0.5 size-6" fill="currentColor" aria-hidden>
      <path d="M6 3.8c0-1.2 1.32-1.94 2.34-1.3L20.4 10.7c.95.58.95 2.02 0 2.6L8.34 21.5C7.32 22.14 6 21.4 6 20.2V3.8Z" />
    </svg>
  );
}

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

  return (
    <div className="flex items-center gap-3 rounded-full border bg-card py-1.5 pr-2 pl-3" data-tour="brief">
        <Button
          variant="default"
          className="size-12 shrink-0 rounded-full p-0"
          onClick={toggle}
          aria-label={playing ? "Pause Morning Brief" : "Play Morning Brief"}
        >
          <TransportIcon playing={playing} />
        </Button>
        <div className="flex h-14 min-w-0 flex-1 flex-col justify-center">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-medium">Morning Brief</p>
            <p className="tabular text-xs text-muted-foreground" aria-live="off">
              {fmt(elapsed)} / {fmt(BRIEFING.durationSeconds)}
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="Morning Brief progress"
            aria-valuemin={0}
            aria-valuemax={BRIEFING.durationSeconds}
            aria-valuenow={Math.round(elapsed)}
            className="mt-1 flex h-5 items-center gap-[2px]"
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
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/briefing" />} className="mr-1 shrink-0">
          Open briefing
        </Button>
    </div>
  );
}
