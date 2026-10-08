"use client";

import type { JSONContent } from "@tiptap/core";
import { ChevronLeftIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { useDefaultLayout, type GroupImperativeHandle, type Layout } from "react-resizable-panels";
import { DocPreview, EditDocButton } from "@/components/library/doc-preview";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DOCUMENT_SCOPES, SHARED_PRD_DOC, clientById, docsInScope, projectById, projectsForClient, scopeLabel, type LibraryDoc } from "@/lib/demo/library";
import {
  itemsFor,
  locateDoc,
  memoryTags,
  placePath,
  sectionsFor,
  type PlaceItem,
  type PlaceSection,
} from "@/lib/demo/places";
import { playClick } from "@/lib/sounds";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";

const sessionLayoutStorage = {
  getItem(key: string) {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(key, value);
  },
};

function useMedia(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const rowClass = "relative rounded-xl px-2 py-3 transition-colors duration-150 hover:bg-accent/60 sm:px-3";
const hitClass =
  "flex w-full min-w-0 flex-col rounded-md text-left outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:ring-3 focus-visible:after:ring-ring/50";

type Phase = "idle" | "enter" | "exit";

function useShownColumns(target: number) {
  const reduce = useMedia("(prefers-reduced-motion: reduce)");
  const [shown, setShown] = useState(target);
  const [phase, setPhase] = useState<Phase>("idle");
  const skip = useRef(true);
  const targetRef = useRef(target);
  targetRef.current = target;

  useLayoutEffect(() => {
    if (skip.current) {
      skip.current = false;
      if (shown !== target) setShown(target);
      return;
    }
    if (reduce) {
      setShown(target);
      setPhase("idle");
      return;
    }
    if (target === shown) {
      if (phase === "exit") setPhase("enter");
      return;
    }
    if (target > shown) {
      setShown(target);
      setPhase("enter");
      return;
    }
    setPhase("exit");
  }, [target, shown, reduce, phase]);

  const settle = useCallback(() => {
    setShown(targetRef.current);
    setPhase("idle");
  }, []);

  return { shown, phase: reduce ? ("idle" as const) : phase, settle };
}

function storedLayout(id: string, panelIds: string[]): Layout | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = window.sessionStorage.getItem(`react-resizable-panels:${[id, ...panelIds].join(":")}`);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!panelIds.every((panelId) => typeof parsed[panelId] === "number")) return undefined;
    return Object.fromEntries(panelIds.map((panelId) => [panelId, parsed[panelId] as number]));
  } catch {
    return undefined;
  }
}

function withKeys(saved: Layout | undefined, fallback: Layout): Layout {
  if (!saved) return fallback;
  const keys = Object.keys(fallback);
  if (!keys.every((key) => typeof saved[key] === "number")) return fallback;
  const next: Layout = {};
  for (const key of keys) next[key] = saved[key] ?? fallback[key] ?? 0;
  return next;
}

const SPLIT_MS = 340;

function easeOutQuad(t: number) {
  return 1 - (1 - t) ** 2;
}

function pageAnchor(groupWidth: number) {
  const font = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const pageWidth = Math.min(groupWidth, 42 * font);
  const gutter = Math.max(0, (groupWidth - pageWidth) / 2);
  const span = groupWidth || 1;
  const layout: Layout = {
    primary: ((gutter + pageWidth) / span) * 100,
    companion: (gutter / span) * 100,
  };
  return { pageWidth, gutter, layout };
}

function useSplitMotion(
  phase: Phase,
  groupRef: RefObject<GroupImperativeHandle | null>,
  prelude: Layout | null,
  destination: Layout,
  settle: () => void,
  surface?: {
    groupEl: RefObject<HTMLElement | null>;
    shell?: RefObject<HTMLElement | null>;
    companion?: RefObject<HTMLElement | null>;
    bar?: RefObject<HTMLElement | null>;
  },
) {
  const preludeRef = useRef(prelude);
  const destinationRef = useRef(destination);
  const surfaceRef = useRef(surface);
  const cut = useRef(false);
  preludeRef.current = prelude;
  destinationRef.current = destination;
  surfaceRef.current = surface;

  useLayoutEffect(() => {
    const surfaceNow = surfaceRef.current;
    const shell = surfaceNow?.shell?.current ?? null;
    const companion = surfaceNow?.companion?.current ?? null;
    const bar = surfaceNow?.bar?.current ?? null;
    const groupEl = surfaceNow?.groupEl.current ?? null;
    const release = () => {
      if (shell) {
        shell.style.width = "";
        shell.style.transform = "";
      }
      if (bar) {
        bar.style.width = "";
        bar.style.transform = "";
      }
      if (companion) {
        companion.style.width = "";
        companion.style.opacity = "";
        companion.style.pointerEvents = "";
      }
      const companionPanel = groupEl?.querySelector<HTMLElement>("[data-testid='companion']");
      if (companionPanel) companionPanel.style.overflow = "";
      const handle = groupEl?.querySelector<HTMLElement>("[data-slot='resizable-handle']");
      if (handle) handle.style.opacity = "";
    };
    if (phase === "idle") {
      release();
      return;
    }
    const group = groupRef.current;
    if (!group) {
      settle();
      return;
    }
    cut.current = false;
    const groupWidth = groupEl?.clientWidth || 0;
    const anchor = shell && groupEl && groupWidth > 0 ? pageAnchor(groupWidth) : null;
    const current = group.getLayout();
    const to = phase === "enter" ? destinationRef.current : (anchor?.layout ?? preludeRef.current ?? destinationRef.current);
    const from =
      phase === "enter"
        ? (anchor?.layout ?? preludeRef.current ?? to)
        : Object.keys(current).length
          ? { ...current }
          : to;
    const title = shell?.querySelector<HTMLElement>("[data-place-title]") ?? null;
    let titleHeight = 0;
    if (title && shell && anchor) {
      const previousWidth = shell.style.width;
      const previousTransform = shell.style.transform;
      shell.style.width = `${Math.round(anchor.pageWidth)}px`;
      shell.style.transform = "";
      title.style.height = "auto";
      titleHeight = title.offsetHeight;
      shell.style.width = previousWidth;
      shell.style.transform = previousTransform;
    }
    const openCompanion = phase === "enter" ? (to.companion ?? 0) : (from.companion ?? 0);
    const holdCompanion = anchor ? (openCompanion / 100) * groupWidth : 0;
    const apply = (layout: Layout) => {
      group.setLayout(layout);
      if (!groupEl) return;
      for (const [id, value] of Object.entries(layout)) {
        const panel = groupEl.querySelector<HTMLElement>(`[data-testid='${id}']`);
        if (panel) panel.style.flexGrow = String(value);
      }
    };
    const place = (openness: number, primary: number) => {
      const clamped = Math.max(0, Math.min(1, openness));
      if (anchor && shell) {
        const primaryPx = (primary / 100) * groupWidth;
        const shift = Math.round(anchor.gutter * (1 - clamped));
        if (clamped >= 1) {
          shell.style.width = "";
          shell.style.transform = "";
        } else {
          shell.style.width = `${Math.max(0, Math.round(primaryPx) - shift)}px`;
          shell.style.transform = shift > 0 ? `translateX(${shift}px)` : "";
        }
        if (bar) {
          if (clamped >= 1) {
            bar.style.width = "";
            bar.style.transform = "";
          } else {
            const width = Math.round(anchor.pageWidth + (groupWidth - anchor.pageWidth) * clamped);
            bar.style.width = `${width}px`;
            bar.style.transform = shift > 0 ? `translateX(${shift}px)` : "";
          }
        }
      }
      if (title && titleHeight > 0) {
        const fadeEnd = 0.34;
        const visible = Math.min(1, Math.max(0, (fadeEnd - clamped) / fadeEnd));
        const spacer = clamped <= fadeEnd ? 1 : (1 - clamped) / (1 - fadeEnd);
        title.style.height = `${Math.round(titleHeight * spacer)}px`;
        title.style.opacity = visible <= 0 ? "0" : visible >= 1 ? "1" : visible.toFixed(3);
      }
      if (companion && anchor && groupEl) {
        const companionPanel = groupEl.querySelector<HTMLElement>("[data-testid='companion']");
        if (clamped >= 1) {
          companion.style.width = "";
          if (companionPanel) companionPanel.style.overflow = "";
        } else {
          companion.style.width = `${Math.round(holdCompanion)}px`;
          if (companionPanel) companionPanel.style.overflow = "hidden";
        }
        const fade = Math.min(1, Math.max(0, (clamped - 0.08) / 0.42));
        companion.style.opacity = String(fade);
        companion.style.pointerEvents = clamped < 1 ? "none" : "";
      }
      const handle = groupEl?.querySelector<HTMLElement>("[data-slot='resizable-handle']");
      if (handle && anchor) handle.style.opacity = clamped >= 1 ? "" : String(Math.min(1, clamped / 0.55));
    };
    apply(from);
    place(phase === "enter" ? 0 : 1, from.primary ?? 0);
    const started = performance.now();
    let frame = 0;
    const step = (now: number) => {
      if (cut.current) {
        release();
        settle();
        return;
      }
      const t = Math.min(1, (now - started) / SPLIT_MS);
      const eased = easeOutQuad(t);
      const next: Layout = {};
      for (const key of Object.keys(to)) {
        const origin = from[key] ?? to[key] ?? 0;
        next[key] = origin + ((to[key] ?? origin) - origin) * eased;
      }
      apply(next);
      place(phase === "enter" ? eased : 1 - eased, next.primary ?? 0);
      if (t < 1) frame = requestAnimationFrame(step);
      else {
        if (phase === "enter") release();
        settle();
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [phase, groupRef, settle]);

  return cut;
}

function Crumbs({ items }: { items: { href: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1;
          const words = item.label.trim().split(/\s+/);
          const last = words.pop() ?? item.label;
          return (
            <li key={`${item.href}-${item.label}`} className="inline">
              {index > 0 ? " " : null}
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "rounded-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                  current && "text-foreground",
                )}
              >
                {words.length ? `${words.join(" ")} ` : null}
                <span className="whitespace-nowrap">
                  {last}
                  {current ? null : "\u00A0/"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function PlaceTitle({ text, withGap }: { text: string; withGap?: boolean }) {
  return (
    <div data-place-title="" className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
      <h1 className={cn("mt-2 text-2xl font-semibold tracking-tight", withGap && "mb-6")}>{text}</h1>
    </div>
  );
}

function PageHead({
  crumbs,
  title,
  titleMode = "static",
  mark,
}: {
  crumbs: { href: string; label: string }[];
  title?: string;
  titleMode?: "static" | "motion";
  mark?: ReactNode;
}) {
  const showTitle = Boolean(title) && titleMode === "static";
  return (
    <div className="px-2 sm:px-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Crumbs items={crumbs} />
        </div>
        {showTitle || !mark ? null : <div className="[&_button]:size-5 [&_svg]:size-3">{mark}</div>}
      </div>
      {showTitle ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {mark}
        </div>
      ) : null}
      {title && titleMode === "motion" ? <PlaceTitle text={title} /> : null}
    </div>
  );
}

function BackStep({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-3"
    >
      <ChevronLeftIcon className="size-4" aria-hidden />
      {label}
    </button>
  );
}

function QuietAdd({ label, placeholder, onAdd }: { label: string; placeholder: string; onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  if (!open) {
    return (
      <button
        type="button"
        className={cn(rowClass, "w-full text-left text-[15px] leading-5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50")}
        onClick={() => {
          playClick();
          setOpen(true);
        }}
      >
        {label}
      </button>
    );
  }
  return (
    <form
      className="flex items-center gap-3 rounded-xl bg-muted/30 px-2 py-3 sm:px-3"
      onSubmit={(event) => {
        event.preventDefault();
        const title = name.trim();
        if (!title) return;
        playClick();
        onAdd(title);
        setName("");
        setOpen(false);
      }}
    >
      <label className="sr-only" htmlFor={`add-${placeholder}`}>
        {placeholder}
      </label>
      <input
        id={`add-${placeholder}`}
        value={name}
        autoFocus
        autoComplete="off"
        placeholder={placeholder}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setName("");
          setOpen(false);
        }}
        className="m-0 h-5 min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] leading-5 font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
      />
      <button
        type="button"
        onClick={() => {
          playClick();
          setName("");
          setOpen(false);
        }}
        className="shrink-0 text-[15px] leading-5 text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
      >
        Cancel
      </button>
      <button type="submit" className="shrink-0 text-[15px] leading-5 font-medium outline-none hover:text-foreground focus-visible:text-foreground">
        Add
      </button>
    </form>
  );
}

function opensAway(item: { href?: string; docId?: string }) {
  return Boolean(item.href && !item.docId);
}

function RowFace({ title, meta, line, away }: { title: string; meta?: string; line?: string; away?: boolean }) {
  return (
    <>
      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[15px] leading-5 font-medium">
          {title}
          {away ? <ExternalLinkIcon className="ml-1.5 inline size-3.5 align-[-2px] text-muted-foreground" aria-hidden /> : null}
        </span>
        {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
      </span>
      {line ? <span className="text-xs text-muted-foreground">{line}</span> : null}
      {away ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </>
  );
}

function ItemRow({ item, active, onSelect }: { item: PlaceItem; active: boolean; onSelect: () => void }) {
  const meta = item.tags?.join(" · ");
  const face = <RowFace title={item.title} meta={meta} line={item.line} away={opensAway(item)} />;
  if (opensAway(item) && item.href) {
    return (
      <li className={rowClass}>
        <a href={item.href} target="_blank" rel="noreferrer" className={hitClass}>
          {face}
        </a>
      </li>
    );
  }
  return (
    <li className={cn(rowClass, active && "bg-accent/60")}>
      <button type="button" aria-current={active ? "true" : undefined} onClick={onSelect} className={hitClass}>
        {face}
      </button>
    </li>
  );
}

function plainText(node: JSONContent | undefined): string {
  if (!node) return "";
  if (node.text) return node.text;
  return (node.content ?? []).map((child) => plainText(child)).join("");
}

function WrittenPreview({ docId, title }: { docId: string; title: string }) {
  const record = useCockpit((s) =>
    docId === SHARED_PRD_DOC ? { title, content: s.prd.content } : s.docs[docId],
  );
  const content = record?.content;
  if (!content) return <p className="px-2 text-sm text-muted-foreground sm:px-3">Nothing written here yet.</p>;
  const first = content.content?.[0];
  const leading = first?.type === "heading" && Number(first.attrs?.level ?? 1) <= 1;
  const named = record?.title && record.title !== docId ? record.title : title;
  const heading = leading ? plainText(first) || named : named;
  const body: JSONContent = leading ? { ...content, content: content.content?.slice(1) } : content;
  return (
    <article className="max-w-[65ch] px-2 sm:px-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="min-w-0 text-2xl font-semibold tracking-tight text-balance">{heading}</h2>
        <EditDocButton docId={docId} title={heading} className="h-8 min-h-8 shrink-0 px-2 font-normal text-muted-foreground" />
      </div>
      <div className="mt-4">
        <DocPreview content={body} />
      </div>
    </article>
  );
}

function PreviewBody({ section, item }: { section?: PlaceSection; item?: PlaceItem }) {
  if (!section) return null;
  if (section.kind === "overview" && section.docId) return <WrittenPreview docId={section.docId} title={section.title} />;
  if (!item || opensAway(item)) return null;
  return <WrittenPreview docId={item.docId ?? item.id} title={item.title} />;
}

function BesideTitle({ crumbs, children }: { crumbs: { href: string; label: string }[]; children: ReactNode }) {
  return (
    <>
      <div className="invisible px-2 sm:px-3" inert aria-hidden>
        <Crumbs items={crumbs} />
      </div>
      <div className="mt-2">{children}</div>
    </>
  );
}

function CrumbBar({
  crumbs,
  barRef,
  mark,
}: {
  crumbs: { href: string; label: string }[];
  barRef?: RefObject<HTMLDivElement | null>;
  mark?: ReactNode;
}) {
  const markRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = markRef.current;
    const bar = node?.offsetParent;
    if (!node || !(bar instanceof HTMLElement)) return;
    const place = () => {
      const edit = document.querySelector<HTMLElement>("[data-edit-doc]");
      if (!edit) {
        node.style.right = "";
        return;
      }
      const gap = bar.getBoundingClientRect().right - edit.getBoundingClientRect().right;
      node.style.right = `${Math.max(0, Math.round(gap))}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(bar);
    document.querySelectorAll<HTMLElement>("[data-slot='resizable-panel']").forEach((panel) => observer.observe(panel));
    return () => observer.disconnect();
  }, [mark, crumbs]);
  return (
    <div ref={barRef} className="relative mb-4 shrink-0 px-6 pt-8 pb-4 sm:pt-12">
      <div className={mark ? "pr-8 pl-2 sm:pr-9 sm:pl-3" : "px-2 sm:px-3"}>
        <Crumbs items={crumbs} />
      </div>
      {mark ? (
        <div ref={markRef} className="absolute right-8 bottom-4 flex h-5 items-center sm:right-9 [&_button]:size-5 [&_svg]:size-3">
          {mark}
        </div>
      ) : null}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border" />
    </div>
  );
}

function ColumnBody({
  children,
  shellRef,
  flushTop,
}: {
  children: ReactNode;
  shellRef?: RefObject<HTMLDivElement | null>;
  flushTop?: boolean;
}) {
  return (
    <div className="edge-scroll h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto">
      <div ref={shellRef} className={flushTop ? "px-6 pb-16" : "px-6 pt-8 pb-16 sm:pt-12"}>
        {children}
      </div>
    </div>
  );
}

const TWO_OPEN: Layout = { primary: 34, companion: 66 };
const THREE_OPEN: Layout = { sections: 22, items: 30, preview: 48 };

function twoAsThree(toOne: boolean): Layout {
  if (toOne) return { sections: 100, items: 0, preview: 0 };
  const saved = storedLayout("library-two", ["primary", "companion"]);
  const primary = saved?.primary ?? 34;
  const companion = saved?.companion ?? 66;
  return { sections: primary, items: companion, preview: 0 };
}

function TwoColumns({
  left,
  right,
  phase,
  settle,
  flushTop,
  barRef,
}: {
  left: ReactNode;
  right: ReactNode;
  phase: Phase;
  settle: () => void;
  flushTop?: boolean;
  barRef?: RefObject<HTMLDivElement | null>;
}) {
  const groupRef = useRef<GroupImperativeHandle | null>(null);
  const groupEl = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const companionRef = useRef<HTMLDivElement | null>(null);
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "library-two",
    panelIds: ["primary", "companion"],
    storage: sessionLayoutStorage,
    onlySaveAfterUserInteractions: true,
  });
  const open = withKeys(defaultLayout, TWO_OPEN);
  const cut = useSplitMotion(phase, groupRef, null, open, settle, { groupEl, shell: shellRef, companion: companionRef, bar: barRef });
  const loose = phase !== "idle";
  return (
    <ResizablePanelGroup
      id="library-two"
      orientation="horizontal"
      className="min-h-0 flex-1"
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
      groupRef={groupRef}
      elementRef={groupEl}
    >
      <ResizablePanel id="primary" defaultSize="34%" minSize={loose ? 0 : 220} className="min-h-0 min-w-0 overflow-hidden">
        <ColumnBody shellRef={shellRef} flushTop={flushTop}>{left}</ColumnBody>
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize panels" onPointerDown={() => { cut.current = true; }} />
      <ResizablePanel id="companion" defaultSize="66%" minSize={loose ? 0 : 320} className="min-h-0 min-w-0 overflow-hidden">
        <div ref={companionRef} className="h-full min-h-0 min-w-0">
          <ColumnBody flushTop={flushTop}>{right}</ColumnBody>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function ThreeColumns({
  sections,
  items,
  preview,
  phase,
  settle,
  toOne,
  flushTop,
}: {
  sections: ReactNode;
  items: ReactNode;
  preview: ReactNode;
  phase: Phase;
  settle: () => void;
  toOne: boolean;
  flushTop?: boolean;
}) {
  const groupRef = useRef<GroupImperativeHandle | null>(null);
  const groupEl = useRef<HTMLDivElement | null>(null);
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "library-three",
    panelIds: ["sections", "items", "preview"],
    storage: sessionLayoutStorage,
    onlySaveAfterUserInteractions: true,
  });
  const open = withKeys(defaultLayout, THREE_OPEN);
  const shut = twoAsThree(toOne);
  const cut = useSplitMotion(phase, groupRef, phase === "enter" ? shut : null, phase === "enter" ? open : shut, settle, { groupEl });
  const loose = phase !== "idle";
  return (
    <ResizablePanelGroup
      id="library-three"
      orientation="horizontal"
      className="min-h-0 flex-1"
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
      groupRef={groupRef}
      elementRef={groupEl}
    >
      <ResizablePanel id="sections" defaultSize="22%" minSize={loose ? 0 : 200} className="min-h-0 min-w-0 overflow-hidden">
        <ColumnBody flushTop={flushTop}>{sections}</ColumnBody>
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize panels" onPointerDown={() => { cut.current = true; }} />
      <ResizablePanel id="items" defaultSize="30%" minSize={loose ? 0 : 240} className="min-h-0 min-w-0 overflow-hidden">
        <ColumnBody flushTop={flushTop}>{items}</ColumnBody>
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize panels" onPointerDown={() => { cut.current = true; }} />
      <ResizablePanel id="preview" defaultSize="48%" minSize={loose ? 0 : 320} className="min-h-0 min-w-0 overflow-hidden">
        <ColumnBody flushTop={flushTop}>{preview}</ColumnBody>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function PageColumn({ children }: { children: ReactNode }) {
  return (
    <div className="edge-scroll min-h-0 flex-1 overflow-y-auto">
      <div className="page-column py-8 sm:py-12">{children}</div>
    </div>
  );
}

export function PlaceScreen({
  placeId,
  title,
  crumbs,
  tour,
  mark,
}: {
  placeId: string;
  title: string;
  crumbs: { href: string; label: string }[];
  tour?: string;
  mark?: ReactNode;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const extraSections = useCockpit((s) => s.extraSections);
  const extraItems = useCockpit((s) => s.extraItems);
  const addSection = useCockpit((s) => s.addSection);
  const addItem = useCockpit((s) => s.addItem);
  const sections = sectionsFor(placeId, extraSections);
  const requested = params.get("section");
  const section = sections.find((entry) => entry.id === requested);
  const liveItems = section && section.kind !== "overview" ? itemsFor(section.id, extraItems) : [];
  const rawItem = section && section.kind !== "overview" ? liveItems.find((entry) => entry.id === params.get("item")) : undefined;
  const item = rawItem && opensAway(rawItem) ? undefined : rawItem;
  const [tag, setTag] = useState("all");
  const [taggedFor, setTaggedFor] = useState(section?.id);
  if (taggedFor !== section?.id) {
    setTaggedFor(section?.id);
    setTag("all");
  }
  const split = useMedia("(min-width: 768px)");
  const roomy = useMedia("(min-width: 1180px)");
  let columns = 1;
  if (section?.kind === "overview") {
    if (split) columns = 2;
  } else if (section && !item) {
    if (split) columns = 2;
  } else if (section && item) {
    if (split && roomy) columns = 3;
    else if (split) columns = 2;
  }
  const { shown, phase, settle } = useShownColumns(columns);
  const snap = useRef({ section, item });
  const holding = shown > columns;
  const view = holding ? snap.current : { section, item };
  if (!holding) snap.current = { section, item };
  const active = view.section;
  const activeItem = view.item;
  const listSection = active && active.kind !== "overview" ? active : undefined;
  const listItems = listSection ? itemsFor(listSection.id, extraItems) : [];
  const tags = listSection?.kind === "memory" ? memoryTags(listSection.id, extraItems) : [];
  const visible = tag === "all" || listSection?.kind !== "memory" ? listItems : listItems.filter((entry) => entry.tags?.includes(tag));

  const go = (sectionId?: string, itemId?: string) => {
    const next = new URLSearchParams(params.toString());
    next.delete("doc");
    if (sectionId) next.set("section", sectionId);
    else next.delete("section");
    if (itemId) next.set("item", itemId);
    else next.delete("item");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const splitLayout = shown >= 2;
  const crumbRef = useRef<HTMLDivElement | null>(null);
  const headCrumbs = active ? [...crumbs, { href: `${pathname}?section=${active.id}`, label: active.title }] : crumbs;
  const titleMoving = Boolean(active) && shown === 2 && (phase === "enter" || (phase === "exit" && columns === 1));
  const head = (
    <PageHead crumbs={headCrumbs} title={active && !titleMoving ? undefined : title} titleMode={titleMoving ? "motion" : "static"} mark={mark} />
  );

  const sectionList = (
    <>
      {splitLayout && titleMoving ? <PlaceTitle text={title} withGap /> : null}
      <ul className={splitLayout ? undefined : "mt-6"}>
        {sections.map((entry) => (
          <li key={entry.id} className={cn(rowClass, entry.id === active?.id && "bg-accent/60")}>
            <button
              type="button"
              aria-current={entry.id === active?.id ? "true" : undefined}
              onClick={() => go(entry.id)}
              className={hitClass}
            >
              <span className="text-[15px] leading-5 font-medium">{entry.title}</span>
            </button>
          </li>
        ))}
      </ul>
      <QuietAdd
        label="New section"
        placeholder="Section name"
        onAdd={(name) => {
          const id = addSection(placeId, name);
          go(id);
        }}
      />
    </>
  );

  const itemList = listSection ? (
    <>
      {listSection.kind === "memory" && tags.length ? (
        <div className="edge-scroll min-w-0 overflow-x-auto px-2 sm:px-3">
          <Tabs value={tag} onValueChange={(value) => setTag(String(value))}>
            <TabsList aria-label="Filter memory" className="w-max justify-start">
              <TabsTrigger value="all" className="px-3">
                All
              </TabsTrigger>
              {tags.map((entry) => (
                <TabsTrigger key={entry} value={entry} className="px-3">
                  {entry}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      ) : null}
      {visible.length ? (
        <ul className={listSection.kind === "memory" ? "mt-3" : undefined}>
          {visible.map((entry) => (
            <ItemRow key={entry.id} item={entry} active={entry.id === activeItem?.id} onSelect={() => go(listSection.id, entry.id)} />
          ))}
        </ul>
      ) : (
        <p className={cn("px-2 text-sm text-muted-foreground sm:px-3", listSection.kind === "memory" && "mt-3")}>{tag === "all" ? "Nothing here yet." : "Nothing with that tag."}</p>
      )}
      <QuietAdd
        label="New item"
        placeholder="Item name"
        onAdd={(name) => {
          const id = addItem(placeId, listSection.id, name, listSection.kind === "memory");
          go(listSection.id, id);
        }}
      />
    </>
  ) : null;

  const sectionColumn = (
    <>
      {splitLayout ? null : head}
      {sectionList}
    </>
  );

  const article = <PreviewBody section={active} item={activeItem} />;
  const columnArticle = <div className="pt-3">{article}</div>;
  let body: ReactNode = <PageColumn>{sectionColumn}</PageColumn>;

  if (active?.kind === "overview") {
    if (shown >= 2) {
      body = <TwoColumns left={sectionColumn} right={columnArticle} phase={phase} settle={settle} flushTop barRef={crumbRef} />;
    } else {
      body = (
        <PageColumn>
          <BackStep label="Sections" onClick={() => go()} />
          {head}
          <div className="mt-6">{article}</div>
        </PageColumn>
      );
    }
  } else if (active && !activeItem) {
    if (shown >= 2) {
      body = <TwoColumns left={sectionColumn} right={itemList} phase={phase} settle={settle} flushTop barRef={crumbRef} />;
    } else {
      body = (
        <PageColumn>
          <BackStep label="Sections" onClick={() => go()} />
          {head}
          <div className="mt-6">{itemList}</div>
        </PageColumn>
      );
    }
  } else if (active && activeItem) {
    const back = <BackStep label={active.title} onClick={() => go(active.id)} />;
    if (shown >= 3) {
      body = <ThreeColumns sections={sectionColumn} items={itemList} preview={columnArticle} phase={phase} settle={settle} toOne={columns <= 1} flushTop />;
    } else if (shown === 2) {
      body = (
        <TwoColumns
          left={sectionColumn}
          right={
            <>
              {back}
              {article}
            </>
          }
          phase={phase}
          settle={settle}
          flushTop
          barRef={crumbRef}
        />
      );
    } else {
      body = (
        <PageColumn>
          {back}
          {head}
          <div className="mt-6">{article}</div>
        </PageColumn>
      );
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-columns={shown} {...(tour ? { "data-tour": tour } : {})}>
      {splitLayout ? <CrumbBar crumbs={headCrumbs} barRef={crumbRef} mark={mark} /> : null}
      {body}
    </div>
  );
}

function placeLabel(placeId: string) {
  if (placeId === "company") return "Team";
  return clientById(placeId)?.name ?? projectById(placeId)?.name ?? placeId;
}

function docHome(doc: LibraryDoc, extraSections: PlaceSection[], extraItems: PlaceItem[]) {
  const located = locateDoc(doc.id, extraSections, extraItems);
  if (!located?.section) return undefined;
  const base = placePath(located.section.placeId);
  const href = located.item
    ? `${base}?section=${located.section.id}&item=${located.item.id}`
    : `${base}?section=${located.section.id}`;
  return { href, label: placeLabel(located.section.placeId) };
}

function extraShelf(extraItems: PlaceItem[]): LibraryDoc[] {
  return extraItems.map((item) => {
    const scope =
      item.placeId === "company"
        ? { scopeType: "company" as const, scopeId: "company" }
        : clientById(item.placeId)
          ? { scopeType: "client" as const, scopeId: item.placeId }
          : { scopeType: "project" as const, scopeId: item.placeId };
    return {
      id: item.docId ?? item.id,
      title: item.title,
      kind: item.href && !item.docId ? ("link" as const) : ("doc" as const),
      ...scope,
      detail: item.tags?.[0] ?? "Note",
      line: item.line,
      href: item.href,
    };
  });
}

function inScope(doc: LibraryDoc, scope: string) {
  if (!scope || scope === "all") return true;
  if (scope === "company") return doc.scopeType === "company";
  if (scope.startsWith("client:")) {
    const clientId = scope.slice("client:".length);
    const projectIds = new Set(projectsForClient(clientId).map((project) => project.id));
    return (doc.scopeType === "client" && doc.scopeId === clientId) || (doc.scopeType === "project" && projectIds.has(doc.scopeId));
  }
  if (scope.startsWith("project:")) return doc.scopeType === "project" && doc.scopeId === scope.slice("project:".length);
  return false;
}

export function DocumentsScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const extraSections = useCockpit((s) => s.extraSections);
  const extraItems = useCockpit((s) => s.extraItems);
  const scope = params.get("scope") || "all";
  const itemId = params.get("item");
  const added = extraShelf(extraItems);
  const docsFor = (id: string) => [...docsInScope(id), ...added.filter((doc) => inScope(doc, id))];
  const docs = docsFor(scope);
  const picked = docs.find((doc) => doc.id === itemId) ?? null;
  const opened = picked && picked.kind === "link" && picked.href ? null : picked;
  const split = useMedia("(min-width: 768px)");
  const columns = opened && split ? 2 : 1;
  const { shown, phase, settle } = useShownColumns(columns);
  const snap = useRef(opened);
  const holding = shown > columns;
  const selected = holding ? snap.current : opened;
  if (!holding) snap.current = opened;

  const go = (nextScope: string, nextItem?: string) => {
    const next = new URLSearchParams();
    if (nextScope !== "all") next.set("scope", nextScope);
    if (nextItem) next.set("item", nextItem);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const home = selected ? docHome(selected, extraSections, extraItems) : undefined;
  const trail = [
    { href: "/library", label: "Library" },
    { href: "/library/documents", label: "Documents" },
  ];

  const filters = (
    <div data-tour="doc-filters" className="edge-scroll mt-6 min-w-0 overflow-x-auto px-2 sm:px-3">
      <Tabs value={scope} onValueChange={(value) => go(String(value))}>
        <TabsList aria-label="Show documents" className="w-max justify-start">
          {DOCUMENT_SCOPES.map((entry) => (
            <TabsTrigger key={entry.id} value={entry.id} className="px-3">
              {entry.label}
              <span className="tabular-nums text-muted-foreground">{docsFor(entry.id).length}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );

  const rows = (
    <ul className="mt-4">
      {docs.map((doc) => {
        const away = doc.kind === "link" && Boolean(doc.href);
        const face = <RowFace title={doc.title} meta={scopeLabel(doc)} away={away} />;
        if (away && doc.href) {
          return (
            <li key={doc.id} className={rowClass}>
              <a href={doc.href} target="_blank" rel="noreferrer" className={hitClass}>
                {face}
              </a>
            </li>
          );
        }
        return (
          <li key={doc.id} className={cn(rowClass, doc.id === selected?.id && "bg-accent/60")}>
            <button type="button" aria-current={doc.id === selected?.id ? "true" : undefined} onClick={() => go(scope, doc.id)} className={hitClass}>
              {face}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const list = (
    <>
      <PageHead crumbs={trail} title="Documents" />
      {filters}
      {rows}
    </>
  );

  const preview = selected ? (
    <>
      <WrittenPreview docId={selected.id} title={selected.title} />
      {home ? (
        <p className="mt-8 max-w-[65ch] px-2 text-sm text-muted-foreground sm:px-3">
          <Link href={home.href} className="rounded-sm text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
            {home.label}
          </Link>
        </p>
      ) : null}
    </>
  ) : null;

  if (selected && shown >= 2) {
    return (
      <div className="flex min-h-0 flex-1 flex-col" data-columns={shown}>
        <TwoColumns left={list} right={<BesideTitle crumbs={trail}>{preview}</BesideTitle>} phase={phase} settle={settle} />
      </div>
    );
  }

  if (selected) {
    return (
      <div className="flex min-h-0 flex-1 flex-col" data-columns={1}>
        <PageColumn>
          <BackStep label="Documents" onClick={() => go(scope)} />
          <PageHead crumbs={trail} title="Documents" />
          <div className="mt-6">{preview}</div>
        </PageColumn>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-columns={1}>
      <PageColumn>{list}</PageColumn>
    </div>
  );
}
