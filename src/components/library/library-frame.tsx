"use client";

import { XIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { LibraryDocPane } from "@/components/library/doc-pane";
import { DOC_BY_ID } from "@/lib/demo/library";

const query = "(min-width: 1024px)";
const subscribe = (cb: () => void) => {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};
const useIsDesktop = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true);

export function useLibraryQuery() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const replace = (next: URLSearchParams) => {
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const openDoc = (id: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("doc", id);
    replace(next);
  };

  const closeDoc = () => {
    const next = new URLSearchParams(params.toString());
    next.delete("doc");
    replace(next);
  };

  const setScope = (scope: string) => {
    const next = new URLSearchParams(params.toString());
    if (scope === "all") next.delete("scope");
    else next.set("scope", scope);
    next.delete("doc");
    replace(next);
  };

  return {
    docId: params.get("doc"),
    scope: params.get("scope") || "all",
    openDoc,
    closeDoc,
    setScope,
  };
}

export function LibraryFrame({ children }: { children: React.ReactNode }) {
  const { docId, closeDoc } = useLibraryQuery();
  const doc = docId ? DOC_BY_ID[docId] : undefined;
  const open = doc?.kind === "doc";
  const isDesktop = useIsDesktop();

  const list = open ? (
    <div className="edge-scroll min-h-0 flex-1 overflow-y-auto px-6 py-8 sm:px-8">{children}</div>
  ) : (
    <div className="edge-scroll min-h-0 flex-1 overflow-y-auto">
      <div className="page-column py-8 sm:py-12">{children}</div>
    </div>
  );

  const editor = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-center border-b px-2 py-1">
        <Button variant="ghost" size="sm" onClick={closeDoc}>
          <XIcon aria-hidden /> Close
        </Button>
      </div>
      {docId ? <LibraryDocPane docId={docId} /> : null}
    </div>
  );

  if (!open) return list;

  if (!isDesktop) return editor;

  return (
    <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
      <ResizablePanel defaultSize="42%" minSize="28%" maxSize="60%" className="min-w-0">
        {list}
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize panels" />
      <ResizablePanel defaultSize="58%" minSize="32%" className="flex min-w-0 flex-col">
        {editor}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
