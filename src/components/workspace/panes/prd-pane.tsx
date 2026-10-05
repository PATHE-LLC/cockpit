"use client";

import { CopyIcon, DownloadIcon, ShareIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCockpit } from "@/lib/store";
import { PaneScroll } from "./shared";

function toMarkdown(title: string, sections: { heading: string; body: string }[]) {
  return `# ${title}\n\n${sections.map((s) => `## ${s.heading}\n\n${s.body}`).join("\n\n")}\n`;
}

export function PrdPane() {
  const prd = useCockpit((s) => s.prd);
  const setTitle = useCockpit((s) => s.setPrdTitle);
  const setSection = useCockpit((s) => s.setPrdSection);

  const markdown = () => toMarkdown(prd.title, prd.sections);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown());
      toast.success("PRD copied as Markdown");
    } catch {
      toast.error("Couldn’t copy. Use Download instead.");
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([markdown()], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "3-strands-dashboard-prd.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PaneScroll className="px-5 py-6 sm:px-8">
        <article className="mx-auto max-w-2xl">
          <div className="flex items-start gap-2">
            <label htmlFor="prd-title" className="sr-only">
              Document title
            </label>
            <Input
              id="prd-title"
              name="prd-title"
              autoComplete="off"
              value={prd.title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-auto border-0 bg-transparent px-0 py-1 text-2xl font-semibold tracking-tight shadow-none focus-visible:ring-0 md:text-2xl"
            />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="icon" aria-label="Share or export document" className="mt-1 shrink-0" />}
              >
                <ShareIcon aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={copy}>
                  <CopyIcon aria-hidden /> Copy as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={download}>
                  <DownloadIcon aria-hidden /> Download .md
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Drafted from the kickoff meeting · edits save automatically in this session
          </p>

          <div className="mt-6 flex flex-col gap-6">
            {prd.sections.map((s) => (
              <section key={s.id} aria-labelledby={`prd-${s.id}`}>
                <h3 id={`prd-${s.id}`} className="text-sm font-semibold tracking-tight">
                  {s.heading}
                </h3>
                <label htmlFor={`prd-body-${s.id}`} className="sr-only">
                  {s.heading} content
                </label>
                <Textarea
                  id={`prd-body-${s.id}`}
                  name={`prd-${s.id}`}
                  autoComplete="off"
                  value={s.body}
                  onChange={(e) => setSection(s.id, e.target.value)}
                  className="mt-1.5 min-h-0 resize-none rounded-lg border-transparent bg-transparent px-2 py-1.5 -mx-2 text-sm leading-relaxed shadow-none hover:bg-accent/40 focus-visible:bg-card dark:bg-transparent"
                />
              </section>
            ))}
          </div>
        </article>
      </PaneScroll>
    </div>
  );
}
