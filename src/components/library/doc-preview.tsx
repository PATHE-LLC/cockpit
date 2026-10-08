"use client";

import type { JSONContent } from "@tiptap/core";
import { XIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { SHARED_PRD_DOC } from "@/lib/demo/library";
import { playClick } from "@/lib/sounds";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";

function renderText(node: JSONContent, key: string) {
  let element: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") element = <strong key={`${key}-b`}>{element}</strong>;
    else if (mark.type === "italic") element = <em key={`${key}-i`}>{element}</em>;
    else if (mark.type === "strike") element = <s key={`${key}-s`}>{element}</s>;
    else if (mark.type === "code") {
      element = (
        <code key={`${key}-c`} className="rounded-md bg-muted px-1.5 py-px font-mono text-[0.9em]">
          {element}
        </code>
      );
    } else if (mark.type === "link") {
      const href = String(mark.attrs?.href ?? "");
      const leaves = href.startsWith("http");
      element = (
        <a
          key={`${key}-a`}
          href={href}
          {...(leaves ? { target: "_blank", rel: "noreferrer" } : {})}
          className="underline decoration-foreground/25 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {element}
          {leaves ? <span className="sr-only"> (opens in a new tab)</span> : null}
        </a>
      );
    }
  }
  return <span key={key}>{element}</span>;
}

function PreviewNode({ node, index }: { node: JSONContent; index: number }) {
  const key = `${node.type}-${index}`;
  if (node.type === "hardBreak") return <br key={key} />;
  const children = node.content?.map((child, childIndex) =>
    child.type === "text" ? renderText(child, `${key}-${childIndex}`) : <PreviewNode key={`${key}-${childIndex}`} node={child} index={childIndex} />,
  );
  if (node.type === "heading") {
    const level = Number(node.attrs?.level ?? 2);
    if (level <= 1) return <h1 className="text-2xl leading-8 font-semibold tracking-tight text-balance">{children}</h1>;
    if (level === 3) return <h3 className="mt-8 mb-1 text-lg leading-7 font-semibold tracking-tight text-balance first:mt-0">{children}</h3>;
    return <h2 className="mt-10 mb-1 text-xl leading-7 font-semibold tracking-tight text-balance first:mt-0">{children}</h2>;
  }
  if (node.type === "paragraph") {
    return <p className="mt-5 text-pretty leading-relaxed first:mt-0">{children}</p>;
  }
  if (node.type === "bulletList" || node.type === "taskList") {
    return <ul className="mt-4 list-disc space-y-1 pl-6 marker:text-muted-foreground [&_p]:mt-0">{children}</ul>;
  }
  if (node.type === "orderedList") {
    const start = Number(node.attrs?.start ?? 1);
    return (
      <ol start={start} className="mt-4 list-decimal space-y-1 pl-6 marker:font-medium marker:text-foreground/70 marker:tabular-nums [&_p]:mt-0">
        {children}
      </ol>
    );
  }
  if (node.type === "listItem" || node.type === "taskItem") return <li className="leading-relaxed">{children}</li>;
  if (node.type === "blockquote") {
    return <blockquote className="mt-4 border-l border-foreground/15 pl-4 text-muted-foreground">{children}</blockquote>;
  }
  if (node.type === "codeBlock") {
    const value = node.content?.map((child) => child.text ?? "").join("") ?? "";
    return (
      <pre className="mt-4 overflow-x-auto rounded-md bg-muted/60 px-3 py-2.5 font-mono text-[13px] leading-6">
        <code>{value}</code>
      </pre>
    );
  }
  if (node.type === "horizontalRule") return <hr className="my-8 border-foreground/10" />;
  if (node.type === "image" && node.attrs?.src) {
    return (
      <img
        src={String(node.attrs.src)}
        alt={String(node.attrs.alt ?? "")}
        className="mt-4 max-w-full rounded-lg"
      />
    );
  }
  return children ? <>{children}</> : null;
}

export function DocPreview({ content }: { content: JSONContent }) {
  return (
    <div className="max-w-[65ch] text-base leading-7 text-foreground [&_h2+p]:mt-0 [&_h3+p]:mt-0 [&_h2+ul]:mt-0 [&_h3+ul]:mt-0 [&_h2+ol]:mt-0 [&_h3+ol]:mt-0 [&_h2+pre]:mt-2 [&_h3+pre]:mt-2">
      {content.content?.map((node, index) => (
        <PreviewNode key={`${node.type}-${index}`} node={node} index={index} />
      ))}
    </div>
  );
}

export function EditDocButton({ docId, title, className }: { docId: string; title: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        data-edit-doc=""
        variant="ghost"
        size="sm"
        className={cn("min-h-10", className)}
        onClick={() => {
          playClick();
          setOpen(true);
        }}
      >
        Edit
      </Button>
      <EditDocDialog docId={docId} title={title} open={open} onOpenChange={setOpen} />
    </>
  );
}

function EditDocDialog({
  docId,
  title,
  open,
  onOpenChange,
}: {
  docId: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const stored = useCockpit((s) => (docId === SHARED_PRD_DOC ? s.prd.content : s.docs[docId]?.content));
  const setDocContent = useCockpit((s) => s.setDocContent);
  const setPrdContent = useCockpit((s) => s.setPrdContent);
  const [draft, setDraft] = useState<JSONContent | undefined>(stored);

  useEffect(() => {
    if (open) setDraft(stored);
  }, [open, stored]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(85dvh,800px)] w-full max-w-[calc(100%-2rem)] flex-col gap-4 p-4 sm:max-w-[920px]"
      >
        <div className="flex h-8 items-center justify-between gap-3">
          <DialogTitle>{title}</DialogTitle>
          <DialogClose render={<Button variant="ghost" size="icon-sm" className="shrink-0" />}>
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-background ring-1 ring-foreground/10">
          {open && draft ? <SimpleEditor content={draft} onUpdate={setDraft} /> : null}
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!draft) return;
              playClick();
              if (docId === SHARED_PRD_DOC) setPrdContent(draft);
              else setDocContent(docId, draft);
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
