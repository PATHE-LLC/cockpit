"use client";

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { PrdPane } from "@/components/workspace/panes/prd-pane";
import { hasLeadingHeading } from "@/lib/demo/editor-content";
import { SHARED_PRD_DOC } from "@/lib/demo/library";
import { useCockpit } from "@/lib/store";

export function LibraryDocPane({ docId }: { docId: string }) {
  const doc = useCockpit((s) => s.docs[docId]);
  const setContent = useCockpit((s) => s.setDocContent);

  if (docId === SHARED_PRD_DOC) return <PrdPane />;
  if (!doc) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">That document is gone.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {hasLeadingHeading(doc.content) ? null : (
        <h1 className="px-6 pt-6 text-2xl font-semibold tracking-tight">{doc.title}</h1>
      )}
      <SimpleEditor content={doc.content} onUpdate={(content) => setContent(docId, content)} tour />
    </div>
  );
}
