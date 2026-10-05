"use client";

import { ExternalLinkIcon, LockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Citation } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

export function PaneScroll({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto p-4 sm:p-5", className)}>{children}</div>;
}

export function CitationList({ citations }: { citations: Citation[] }) {
  return (
    <ol className="stagger-in flex flex-col gap-3">
      {citations.map((c, i) => (
        <li
          key={c.id}
          style={{ "--i": i } as React.CSSProperties}
          className="rounded-xl border bg-card p-3.5"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand"
            >
              {c.id}
            </span>
            <div className="min-w-0 flex-1">
              <a
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex max-w-full items-center gap-1.5 rounded-sm text-sm font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="truncate">{c.title}</span>
                <ExternalLinkIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{c.publisher}</span>
                {c.internal && (
                  <Badge variant="outline" className="h-4 gap-1 px-1.5 text-[10px]">
                    <LockIcon className="size-2.5" aria-hidden /> Internal
                  </Badge>
                )}
              </div>
              <blockquote className="mt-2 border-l-2 border-brand/40 pl-3 text-sm text-muted-foreground">
                {c.quote}
              </blockquote>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PaneTabs({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
