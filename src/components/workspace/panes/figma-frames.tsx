"use client";

import { AlertCircleIcon, DownloadIcon, GlobeIcon, MicIcon, RefreshCwIcon } from "lucide-react";
import { LANGS, ORIGINAL_LINES, type Lang } from "@/lib/demo/content";
import { cn } from "@/lib/utils";

const SPEAKERS = ["Priya", "Marco", "You"] as const;

function MockButton({ children, primary, className }: { children: React.ReactNode; primary?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center justify-center gap-1 rounded-md px-2.5 text-[11px] font-medium",
        primary ? "bg-primary text-primary-foreground" : "border bg-background",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PickerFrame({ lang }: { lang: Lang }) {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div>
        <p className="text-sm font-semibold">Translate this call</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Captions appear in the language you pick.</p>
      </div>
      <div className="flex flex-col gap-1.5" role="presentation">
        {(Object.keys(LANGS) as Lang[]).map((l) => (
          <div
            key={l}
            className={cn(
              "flex items-center justify-between rounded-lg border px-3 py-2 text-xs",
              l === lang ? "border-brand bg-brand-soft" : "bg-background",
            )}
          >
            <span className="font-medium">{LANGS[l].native}</span>
            <span className="text-muted-foreground">{LANGS[l].label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span>Translate my speech too</span>
        <span className="h-4 w-7 rounded-full bg-muted p-0.5">
          <span className="block size-3 rounded-full bg-background shadow-sm" />
        </span>
      </div>
      <MockButton primary className="mt-auto h-8">
        Start translating
      </MockButton>
    </div>
  );
}

export function LiveFrame({ lang, originalMode }: { lang: Lang; originalMode: "always" | "hover" }) {
  const translated = LANGS[lang].lines;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium">
          <span className="size-1.5 rounded-full bg-destructive" aria-hidden /> Live
        </span>
        <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">
          <GlobeIcon className="size-3" aria-hidden /> to {LANGS[lang].label}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        {translated.map((line, i) => (
          <div key={i} className="group flex gap-2">
            <span
              aria-hidden
              className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-[9px] font-semibold"
            >
              {SPEAKERS[i][0]}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">{SPEAKERS[i]}</p>
              <p className="text-xs leading-snug">
                {i === 1 ? (
                  <>
                    {line.slice(0, Math.floor(line.length * 0.55))}
                    <span className="underline decoration-dotted decoration-warn underline-offset-2">
                      {line.slice(Math.floor(line.length * 0.55), Math.floor(line.length * 0.75))}
                    </span>
                    {line.slice(Math.floor(line.length * 0.75))}
                  </>
                ) : (
                  line
                )}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-[10px] leading-snug text-muted-foreground",
                  originalMode === "hover" && "max-h-0 overflow-hidden opacity-0 transition-[opacity,max-height] duration-150 group-hover:max-h-10 group-hover:opacity-100",
                )}
              >
                {ORIGINAL_LINES[i]}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t px-3 py-2 text-[10px] text-muted-foreground">
        <MicIcon className="size-3" aria-hidden /> Dotted words are low confidence
      </div>
    </div>
  );
}

export function ReviewFrame({ lang, srt }: { lang: Lang; srt: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-[11px] font-semibold">Review translation</span>
        <MockButton>
          <DownloadIcon className="size-3" aria-hidden /> Export
        </MockButton>
      </div>
      <div className="grid flex-1 grid-cols-2 divide-x text-[10px] leading-snug">
        <div className="space-y-2 p-3">
          <p className="font-medium text-muted-foreground">English</p>
          {ORIGINAL_LINES.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
        <div className="space-y-2 p-3">
          <p className="font-medium text-muted-foreground">{LANGS[lang].label}</p>
          {LANGS[lang].lines.map((l) => (
            <p key={l} className="rounded bg-brand-soft/60 px-1 py-0.5">
              {l}
            </p>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 border-t px-3 py-2">
        {["PDF", "DOCX", "Copy", ...(srt ? ["SRT"] : [])].map((f) => (
          <span key={f} className={cn("rounded-full border px-2 py-0.5 text-[10px]", f === "SRT" && "border-brand bg-brand-soft text-brand")}>
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ErrorFrame() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-warn-soft">
        <AlertCircleIcon className="size-5 text-warn" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold">Translation unavailable</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          We&rsquo;re still capturing the original transcript. You won&rsquo;t lose anything.
        </p>
      </div>
      <div className="flex gap-2">
        <MockButton primary>
          <RefreshCwIcon className="size-3" aria-hidden /> Try again
        </MockButton>
        <MockButton>Keep original</MockButton>
      </div>
    </div>
  );
}
