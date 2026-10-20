"use client";

import {
  type ReactNode,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import type { GroupImperativeHandle } from "react-resizable-panels";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const subscribe = (change: () => void) => {
  const query = window.matchMedia?.("(min-width: 1024px)");
  query?.addEventListener("change", change);
  return () => query?.removeEventListener("change", change);
};
const snapshot = () =>
  Boolean(window.matchMedia?.("(min-width: 1024px)").matches);
export function QASplit({
  open,
  list,
  detail,
}: {
  open: boolean;
  list: ReactNode;
  detail: ReactNode;
}) {
  const desktop = useSyncExternalStore(subscribe, snapshot, () => false);
  const group = useRef<GroupImperativeHandle | null>(null);
  const frame = useRef(0);
  useLayoutEffect(() => {
    if (!open || !desktop || !group.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      group.current.setLayout({ results: 38, evidence: 62 });
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 240);
      const width = 62 * (1 - Math.pow(1 - progress, 3));
      group.current?.setLayout({ results: 100 - width, evidence: width });
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [open, desktop]);
  if (!open) return list;
  if (!desktop) return detail;
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      groupRef={group}
      className="min-h-0 flex-1"
      onPointerDown={() => cancelAnimationFrame(frame.current)}
    >
      <ResizablePanel
        id="results"
        defaultSize="100%"
        minSize="28%"
        className="flex min-h-0 min-w-0 flex-col"
      >
        {list}
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize result details" />
      <ResizablePanel
        id="evidence"
        defaultSize="0%"
        minSize="0%"
        maxSize="72%"
        className="flex min-h-0 min-w-0 flex-col"
      >
        {detail}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
