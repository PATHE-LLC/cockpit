"use client";

import { CopyIcon, DownloadIcon, ListIcon, ShareIcon, TypeIcon } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PaneScroll } from "./shared";

function toMarkdown(title: string, sections: { heading: string; body: string }[]) {
  return `# ${title}\n\n${sections.map((s) => `## ${s.heading}\n\n${s.body}`).join("\n\n")}\n`;
}

function isList(body: string) {
  const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.length > 0 && lines.every((line) => /^(\d+\.|[-*])\s+/.test(line));
}

function listItems(body: string) {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^(\d+\.|[-*])\s+/, ""));
}

function numbered(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function FitText({
  value,
  onChange,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      aria-label={label}
      value={value}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "min-h-6 w-full resize-none border-0 bg-transparent p-0 text-sm leading-relaxed outline-none placeholder:text-muted-foreground",
        className,
      )}
    />
  );
}

export function PrdPane() {
  const prd = useCockpit((s) => s.prd);
  const setTitle = useCockpit((s) => s.setPrdTitle);
  const setHeading = useCockpit((s) => s.setPrdHeading);
  const setSection = useCockpit((s) => s.setPrdSection);
  const addSection = useCockpit((s) => s.addPrdSection);

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
        <article className="mx-auto w-full" data-tour="doc-editor">
          <div className="flex items-start gap-2">
            <label htmlFor="prd-title" className="sr-only">
              Document title
            </label>
            <input
              id="prd-title"
              name="prd-title"
              autoComplete="off"
              value={prd.title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent py-1 text-2xl font-semibold tracking-tight outline-none"
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
          <div className="mt-3 flex flex-wrap gap-1">
            <Button type="button" size="sm" variant="ghost" onClick={() => addSection("text")}>
              <TypeIcon aria-hidden /> Text
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => addSection("list")}>
              <ListIcon aria-hidden /> List
            </Button>
          </div>

          <div className="mt-6 flex flex-col gap-7">
            {prd.sections.map((section) => {
              const list = isList(section.body);
              const items = list ? listItems(section.body) : [];
              return (
                <section key={section.id} aria-labelledby={`prd-${section.id}`}>
                  <input
                    id={`prd-${section.id}`}
                    aria-label={`${section.heading || "Section"} heading`}
                    value={section.heading}
                    onChange={(e) => setHeading(section.id, e.target.value)}
                    className="w-full border-0 bg-transparent text-lg font-semibold tracking-tight outline-none"
                  />
                  {list ? (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {items.map((item, index) => (
                        <li key={`${section.id}-${index}`} className="flex items-start gap-2">
                          <span className="pt-0.5 text-sm text-muted-foreground tabular-nums">{index + 1}.</span>
                          <FitText
                            label={`${section.heading} item ${index + 1}`}
                            value={item}
                            onChange={(value) => {
                              const next = items.map((current, i) => (i === index ? value : current));
                              setSection(section.id, numbered(next));
                            }}
                          />
                        </li>
                      ))}
                      <li>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          className="text-muted-foreground"
                          onClick={() => setSection(section.id, numbered([...items, ""]))}
                        >
                          Add item
                        </Button>
                      </li>
                    </ul>
                  ) : (
                    <FitText
                      label={`${section.heading} body`}
                      value={section.body}
                      onChange={(value) => setSection(section.id, value)}
                      className="mt-2"
                    />
                  )}
                </section>
              );
            })}
          </div>
        </article>
      </PaneScroll>
    </div>
  );
}
