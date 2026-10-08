"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { playClick } from "@/lib/sounds";
import { useCockpit } from "@/lib/store";

type Step = {
  path: string;
  selector: string;
  line: string;
  /** null clears a section query. A string opens that section. */
  section?: string | null;
  keep?: "dialog" | "doc" | "pr";
  prepare?: () => void | Promise<void>;
};

const STEPS: Step[] = [
  {
    path: "/",
    selector: "[data-tour=home]",
    line: "The checklist is the front door. Ask or start a task in the composer, play the brief, or tick a task. Library and favorite projects are on the rail.",
  },
  {
    path: "/library",
    selector: "[data-tour=library]",
    line: "Library is the shared shelf: Team, clients, projects, and documents.",
  },
  {
    path: "/library/company",
    selector: "[data-tour=company]",
    line: "Team is the playbook. Overview, Processes, and Resources open beside the list. An SOP is a document. Edit writes it, then saving returns here.",
  },
  {
    path: "/library/clients/solar-light",
    selector: "[data-tour=client]",
    line: "Solar Light wants short decks. Overview is the note. Client memory keeps the meetings and preferences.",
  },
  {
    path: "/library/projects/cockpit-os",
    selector: "[data-tour=project]",
    section: null,
    line: "A project opens as one column. The star favorites it. Cockpit OS is already on the rail. A project can have no client.",
  },
  {
    path: "/library/projects/cockpit-os",
    selector: "[data-tour=project]",
    section: "cockpit-files",
    line: "Open a section and the columns split. Files and links stay on the left. The writing opens on the right, under the breadcrumb.",
  },
  {
    path: "/library/projects/cockpit-os",
    selector: "[data-tour=favorites]",
    section: "cockpit-files",
    line: "Favorited projects sit in the middle of the rail. Each mark is that project. Hover for the name.",
    prepare: () => {
      const state = useCockpit.getState();
      if (!state.favoriteProjects.includes("cockpit-os")) state.toggleFavoriteProject("cockpit-os");
    },
  },
  {
    path: "/library/documents",
    selector: "[data-tour=doc-filters]",
    line: "Documents are files and links in one list. Filter to the company, Solar Light, or a project.",
  },
  {
    path: "/chats/chat-tour",
    selector: "[data-tour=task-chat]",
    line: "Chats are personal. Add to checklist turns this same thread into a task. It does not start another chat.",
  },
  {
    path: "/briefing",
    selector: "[data-tour=briefing]",
    line: "Read the full account, then answer in the composer at the bottom. The checklist is the same one as home.",
  },
  {
    path: "/briefing",
    selector: "[data-slot=dialog-content]",
    keep: "dialog",
    line: "Name the task, set a due date and project, and add a description only if you need one. From chat, say what it is, who it’s for, and what done looks like.",
    prepare: () => useCockpit.getState().openTaskForm(),
  },
  {
    path: "/tasks",
    selector: "[data-tour=filters]",
    line: "Use Needs you when you only want what’s waiting. Done and Archive stay icons until you select them. Search by name.",
  },
  {
    path: "/tasks/glenn-supabase-rls",
    selector: "[data-tour=task-chat]",
    line: "Read what happened and what’s ready, then edit the reply and press Send. The sources stay in the thread.",
    prepare: () => expandReply(),
  },
  {
    path: "/tasks/three-strands-dashboard",
    selector: "[data-tour=doc-editor]",
    keep: "doc",
    line: "Edit the headings, text, and lists beside the chat. Open the prototype the same way. Figma opens in a new tab.",
    prepare: () => useCockpit.getState().openArtifact("three-strands-dashboard", "prd"),
  },
  {
    path: "/tasks/model-6d-self-service",
    selector: "[data-tour=sources]",
    keep: "pr",
    line: "The pills are the agent looking something up: the company SOP, the Solar Light note, and the form spec. Press View PR to put the pull request here. Mark done stays on the header. Archive is in the menu, and Delete only shows up after you archive, next to Restore.",
    prepare: () => useCockpit.getState().openArtifact("model-6d-self-service", "diff"),
  },
];

function settle(step: Step | null) {
  const store = useCockpit.getState();
  if (step?.keep !== "dialog") store.closeTaskForm();
  if (step?.keep !== "doc") store.closeArtifact("three-strands-dashboard");
  if (step?.keep !== "pr") store.closeArtifact("model-6d-self-service");
  toast.dismiss();
  if (document.querySelector("[role=menu]")) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  }
}

async function expandReply() {
  for (let i = 0; i < 80; i++) {
    const trigger = [...document.querySelectorAll<HTMLElement>("[data-slot=collapsible-trigger]")].find(
      (node) => node.textContent?.replace(/\s+/g, " ").trim() === "Reply",
    );
    if (trigger) {
      const root = trigger.closest("[data-slot=collapsible]");
      const open =
        root?.hasAttribute("data-open") ||
        root?.hasAttribute("data-panel-open") ||
        trigger.getAttribute("aria-expanded") === "true";
      if (!open) trigger.click();
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      document.querySelector("#slack-draft")?.scrollIntoView({ block: "center", inline: "nearest" });
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
}

function waitFor(selector: string, cancelled: () => boolean, timeout = 5000) {
  return new Promise<Element | null>((resolve) => {
    const start = performance.now();
    const tick = () => {
      if (cancelled()) return resolve(null);
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      if (performance.now() - start > timeout) return resolve(null);
      window.requestAnimationFrame(tick);
    };
    tick();
  });
}

function spotlightRect(primary: Element) {
  const rects = [primary.getBoundingClientRect()];
  const top = Math.min(...rects.map((r) => r.top));
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return { top, left, width: right - left, height: bottom - top };
}

export function TeamTour() {
  return (
    <Suspense fallback={null}>
      <TeamTourInner />
    </Suspense>
  );
}

function TeamTourInner() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const tourOn = search.get("tour") === "1";
  const section = search.get("section");
  const [step, setStep] = useState<number | null>(null);
  const [box, setBox] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardBox, setCardBox] = useState({ width: 340, height: 168 });
  const dismissed = useRef(false);

  useEffect(() => {
    if (!tourOn) {
      dismissed.current = false;
      return;
    }
    if (dismissed.current) return;
    setStep(0);
  }, [tourOn]);

  const end = useCallback(() => {
    playClick();
    dismissed.current = true;
    settle(null);
    setStep(null);
    setBox(null);
    document.documentElement.removeAttribute("data-tour");
    if (search.get("tour") !== "1") return;
    const params = new URLSearchParams(search.toString());
    params.delete("tour");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [pathname, router, search]);

  useEffect(() => {
    if (step == null) {
      document.documentElement.removeAttribute("data-tour");
      return;
    }
    document.documentElement.setAttribute("data-tour", String(step));
  }, [step]);

  useEffect(() => {
    if (step == null) return;
    let cancelled = false;
    let detach = () => {};
    const current = STEPS[step];

    const measure = () => {
      if (cancelled) return;
      const live = document.querySelector(current.selector);
      if (!live) return;
      const pad = 8;
      const next = spotlightRect(live);
      const measured = {
        top: Math.max(8, next.top - pad),
        left: Math.max(8, next.left - pad),
        width: next.width + pad * 2,
        height: next.height + pad * 2,
      };
      setBox((prev) =>
        prev &&
        prev.top === measured.top &&
        prev.left === measured.left &&
        prev.width === measured.width &&
        prev.height === measured.height
          ? prev
          : measured,
      );
    };

    const run = async () => {
      const wanted = current.section;
      const sectionOk = wanted === undefined || (wanted === null ? section == null : section === wanted);
      if (pathname !== current.path || !sectionOk) {
        router.push(wanted ? `${current.path}?section=${wanted}` : current.path);
        return;
      }
      settle(current);
      await current.prepare?.();
      if (cancelled) return;
      const el = await waitFor(current.selector, () => cancelled);
      if (!el || cancelled) return;
      if (el.getBoundingClientRect().height < window.innerHeight * 0.7) {
        el.scrollIntoView({ block: "center", inline: "nearest" });
      }
      if (cancelled) return;
      measure();
      window.addEventListener("resize", measure);
      window.addEventListener("scroll", measure, true);
      const id = window.setInterval(measure, 250);
      detach = () => {
        window.removeEventListener("resize", measure);
        window.removeEventListener("scroll", measure, true);
        window.clearInterval(id);
      };
    };

    void run();
    return () => {
      cancelled = true;
      detach();
    };
  }, [pathname, router, section, step]);

  useLayoutEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.width !== cardBox.width || rect.height !== cardBox.height) {
      setCardBox({ width: rect.width, height: rect.height });
    }
  }, [box, cardBox.height, cardBox.width, step]);

  if (step == null) return null;
  const current = STEPS[step];
  const place = box ? placeCard(box, cardBox) : { top: 24, left: 24 };

  return (
    <div className="fixed inset-0 z-[1000000000]" role="presentation">
      <div className="absolute inset-0" />
      {box ? (
        <div
          className="pointer-events-none absolute rounded-2xl motion-safe:transition-[top,left,width,height] motion-safe:duration-500 motion-safe:ease-out"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
            boxShadow: "0 0 0 2px var(--color-foreground), 0 0 0 9999px rgb(0 0 0 / 0.55)",
          }}
        />
      ) : null}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-label="Team tour"
        className="absolute w-[min(22rem,calc(100vw-2rem))] rounded-2xl border bg-popover p-4 text-popover-foreground shadow-lg motion-safe:transition-[top,left] motion-safe:duration-500 motion-safe:ease-out"
        style={{ top: place.top, left: place.left }}
      >
        <p className="text-xs text-muted-foreground">
          {step + 1} / {STEPS.length}
        </p>
        <p className="mt-2 text-sm leading-relaxed">{current.line}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={end}>
            Skip
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={step === 0}
              onClick={() => {
                playClick();
                setStep((n) => (n == null ? n : n - 1));
              }}
            >
              Back
            </Button>
            {step === STEPS.length - 1 ? (
              <Button size="sm" onClick={end}>
                Done
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  playClick();
                  setStep((n) => (n == null ? n : n + 1));
                }}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function placeCard(
  target: { top: number; left: number; width: number; height: number },
  card: { width: number; height: number },
) {
  const margin = 16;
  const gap = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rail = target.left > vw * 0.7 && target.width < 140;
  const roomLeft = target.left - margin;
  let left = target.left;
  let top = target.top + target.height + gap;
  if (!rail && target.left > vw * 0.35 && roomLeft >= card.width + gap) {
    return {
      top: Math.min(Math.max(margin, target.top + 24), vh - card.height - margin),
      left: target.left - card.width - gap,
    };
  }
  if (rail) {
    left = target.left - card.width - gap;
    top = Math.min(Math.max(margin, target.top + 8), vh - card.height - margin);
  } else if (target.height > vh * 0.72) {
    top = margin;
    left = Math.min(target.left + target.width - card.width - 72, vw - card.width - margin - 64);
  } else if (top + card.height > vh - margin) {
    const above = target.top - card.height - gap;
    top = above >= margin ? above : vh - card.height - margin;
  }
  left = Math.min(Math.max(margin, left), vw - card.width - margin);
  top = Math.min(Math.max(margin, top), vh - card.height - margin);
  return { top, left };
}
