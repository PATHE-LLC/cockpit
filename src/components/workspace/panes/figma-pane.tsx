"use client";

import { CheckCircle2Icon, ExternalLinkIcon, MessageSquareIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Artifact,
  ArtifactActions,
  ArtifactContent,
  ArtifactDescription,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FIGMA_COMMENTS, LANGS, type Lang } from "@/lib/demo/content";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ErrorFrame, LiveFrame, PickerFrame, ReviewFrame } from "./figma-frames";
import { PaneScroll } from "./shared";

export function FigmaPane({ taskId }: { taskId: string }) {
  const pane = useCockpit((s) => s.pane[taskId] ?? "canvas");
  const setPane = useCockpit((s) => s.setPane);
  const figma = useCockpit((s) => s.figma);
  const select = useCockpit((s) => s.figmaSelect);
  const setLang = useCockpit((s) => s.figmaSetLang);
  const approve = useCockpit((s) => s.figmaApprove);
  const setMode = useCockpit((s) => s.figmaSetOriginalMode);
  const resolve = useCockpit((s) => s.figmaResolve);
  const selected = figma.frames.find((f) => f.id === figma.selected) ?? figma.frames[0];
  const open = FIGMA_COMMENTS.filter((c) => !figma.resolved.includes(c.id)).length;

  const body = (id: string) =>
    id === "picker" ? (
      <PickerFrame lang={figma.lang} />
    ) : id === "live" ? (
      <LiveFrame lang={figma.lang} originalMode={figma.originalMode} />
    ) : id === "review" ? (
      <ReviewFrame lang={figma.lang} srt={figma.srt} />
    ) : (
      <ErrorFrame />
    );

  return (
    <Tabs value={pane} onValueChange={(v) => setPane(taskId, String(v))} className="min-h-0 flex-1 gap-0">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2 sm:px-5">
        <TabsList aria-label="Figma panels">
          <TabsTrigger value="canvas" className="px-3">Canvas</TabsTrigger>
          <TabsTrigger value="comments" className="px-3">Comments · {open}</TabsTrigger>
        </TabsList>
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast("Opening Figma", { description: "Simulated. The shared file is a demo." })}
        >
          <ExternalLinkIcon aria-hidden /> Open in Figma
        </Button>
      </div>
      <TabsContent value="canvas" className="flex min-h-0 flex-col">
        <PaneScroll>
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex -space-x-1.5" aria-hidden>
              {["S", "A"].map((n) => (
                <span key={n} className="grid size-5 place-items-center rounded-full border-2 border-background bg-secondary text-[9px] font-semibold text-foreground">
                  {n}
                </span>
              ))}
            </span>
            Sam is also viewing this page
          </div>
          <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3">
            {figma.frames.map((f) => {
              const isSel = f.id === figma.selected;
              return (
                <div key={f.id} className="w-64 shrink-0 snap-start sm:w-72">
                  <Artifact
                    className={cn(
                      "h-full transition-shadow duration-150",
                      isSel && "ring-2 ring-brand",
                    )}
                  >
                    <ArtifactHeader className="gap-2 py-2">
                      <div className="min-w-0">
                        <ArtifactTitle className="truncate text-xs">{f.name}</ArtifactTitle>
                        <ArtifactDescription className="truncate text-[11px]">{f.note}</ArtifactDescription>
                      </div>
                      <ArtifactActions>
                        {f.approved && <CheckCircle2Icon className="size-4 text-brand" aria-label="Approved" />}
                      </ArtifactActions>
                    </ArtifactHeader>
                    <ArtifactContent className="p-0">
                      <button
                        type="button"
                        onClick={() => select(f.id)}
                        aria-pressed={isSel}
                        aria-label={`Select frame ${f.name}`}
                        className="block aspect-[3/4] w-full cursor-pointer bg-card text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {body(f.id)}
                      </button>
                    </ArtifactContent>
                  </Artifact>
                </div>
              );
            })}
          </div>

          <section aria-labelledby="inspector-h" className="mt-2 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 id="inspector-h" className="text-sm font-medium">{selected.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Drafted by {selected.author === "AI" ? "CockpitOS" : selected.author} · {selected.note}
                </p>
              </div>
              <Button
                size="sm"
                variant={selected.approved ? "secondary" : "default"}
                onClick={() => approve(selected.id, !selected.approved)}
              >
                {selected.approved ? "Approved · undo" : "Approve frame"}
              </Button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <fieldset className="grid gap-1.5">
                <legend className="text-xs font-medium text-muted-foreground">Preview language</legend>
                <ToggleGroup
                  value={[figma.lang]}
                  onValueChange={(v) => v[0] && setLang(v[0] as Lang)}
                  variant="outline"
                  size="sm"
                  spacing={0}
                  aria-label="Preview language"
                >
                  {(Object.keys(LANGS) as Lang[]).map((l) => (
                    <ToggleGroupItem key={l} value={l}>{LANGS[l].label}</ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </fieldset>
              <fieldset className="grid gap-1.5">
                <legend className="text-xs font-medium text-muted-foreground">Original text</legend>
                <ToggleGroup
                  value={[figma.originalMode]}
                  onValueChange={(v) => v[0] && setMode(v[0] as "always" | "hover")}
                  variant="outline"
                  size="sm"
                  spacing={0}
                  aria-label="Original text behaviour"
                >
                  <ToggleGroupItem value="always">Always visible</ToggleGroupItem>
                  <ToggleGroupItem value="hover">On hover</ToggleGroupItem>
                </ToggleGroup>
              </fieldset>
            </div>
          </section>
        </PaneScroll>
      </TabsContent>
      <TabsContent value="comments" className="flex min-h-0 flex-col">
        <PaneScroll>
          <ul className="stagger-in flex flex-col gap-2.5">
            {FIGMA_COMMENTS.map((c, i) => {
              const done = figma.resolved.includes(c.id);
              const frame = figma.frames.find((f) => f.id === c.frame);
              return (
                <li
                  key={c.id}
                  style={{ "--i": i } as React.CSSProperties}
                  className={cn("rounded-xl border bg-card p-3.5", done && "opacity-60")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MessageSquareIcon className="size-3.5" aria-hidden />
                      <span className="font-medium text-foreground">{c.author === "AI" ? "CockpitOS" : c.author}</span>
                      on {frame?.name}
                    </p>
                    {done && <Badge variant="outline">Resolved</Badge>}
                  </div>
                  <p className="mt-2 text-sm">{c.text}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { select(c.frame); setPane(taskId, "canvas"); }}>
                      Go to frame
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => resolve(c.id)}>
                      {done ? "Reopen" : "Resolve"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </PaneScroll>
      </TabsContent>
    </Tabs>
  );
}
