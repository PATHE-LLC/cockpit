"use client";

import { DocEditor } from "@/components/library/doc-editor";
import { PrdPane } from "@/components/workspace/panes/prd-pane";
import { DOC_BY_ID, SHARED_PRD_DOC } from "@/lib/demo/library";
import { useCockpit } from "@/lib/store";

export function LibraryDocPane({ docId }: { docId: string }) {
  const doc = useCockpit((s) => s.docs[docId]);
  const setTitle = useCockpit((s) => s.setDocTitle);
  const setHeading = useCockpit((s) => s.setDocHeading);
  const setSection = useCockpit((s) => s.setDocSection);
  const addSection = useCockpit((s) => s.addDocSection);

  if (docId === SHARED_PRD_DOC) return <PrdPane />;
  if (!doc) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">That document is gone.</p>
      </div>
    );
  }

  const known = DOC_BY_ID[docId];
  return (
    <DocEditor
      titleId={`doc-${docId}-title`}
      title={doc.title}
      sections={doc.sections}
      onTitle={(value) => setTitle(docId, value)}
      onHeading={(id, value) => setHeading(docId, id, value)}
      onBody={(id, value) => setSection(docId, id, value)}
      onAdd={(kind) => addSection(docId, kind)}
      downloadName={`${known?.id ?? docId}.md`}
    />
  );
}
