"use client";

import { Fragment } from "react";
import {
  InlineCitationCardBody,
  InlineCitationQuote,
  InlineCitationSource,
} from "@/components/ai-elements/inline-citation";
import { HoverCard, HoverCardTrigger } from "@/components/ui/hover-card";
import type { Citation } from "@/lib/demo/types";

export function CitedText({ text, citations }: { text: string; citations: Citation[] }) {
  const byId = Object.fromEntries(citations.map((c) => [c.id, c]));
  const parts = text.split(/(\[\d+\])/g);
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        const c = m ? byId[m[1]] : undefined;
        if (!c) return <Fragment key={i}>{part}</Fragment>;
        return (
          <HoverCard key={i}>
            <HoverCardTrigger
              delay={100}
              closeDelay={100}
              render={
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Source ${c.id}: ${c.title}`}
                  className="mx-0.5 inline-flex h-[1.15rem] min-w-[1.15rem] -translate-y-px items-center justify-center rounded-full bg-brand-soft px-1 align-middle text-[10px] font-semibold text-brand no-underline outline-none transition-colors duration-150 hover:bg-brand hover:text-brand-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              }
            >
              {c.id}
            </HoverCardTrigger>
            <InlineCitationCardBody>
              <div className="space-y-2 p-3">
                <InlineCitationSource title={c.title} url={c.url} description={c.publisher} />
                <InlineCitationQuote>{c.quote}</InlineCitationQuote>
              </div>
            </InlineCitationCardBody>
          </HoverCard>
        );
      })}
    </p>
  );
}
