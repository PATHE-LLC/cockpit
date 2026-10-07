"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BRIEF_SRC = "/sounds/morning-brief.mp3";
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio(BRIEF_SRC);
    audio.preload = "auto";
    audioRef.current = audio;

    const syncTime = () => setElapsed(audio.currentTime || 0);
    const syncDuration = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setElapsed(Number.isFinite(audio.duration) ? audio.duration : audio.currentTime || 0);
    };

    audio.addEventListener("timeupdate", syncTime);
    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("durationchange", syncDuration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", syncTime);
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    if (audio.ended) audio.currentTime = 0;
    void audio.play();
  };

  const progress = duration > 0 ? Math.min(1, elapsed / duration) : 0;

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
              {fmt(elapsed)} / {fmt(duration)}
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="Morning Brief progress"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
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
