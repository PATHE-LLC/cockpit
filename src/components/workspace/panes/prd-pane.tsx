"use client";

import { DocEditor } from "@/components/library/doc-editor";
import { useCockpit } from "@/lib/store";

export function PrdPane() {
  const prd = useCockpit((s) => s.prd);
  const setTitle = useCockpit((s) => s.setPrdTitle);
  const setHeading = useCockpit((s) => s.setPrdHeading);
  const setSection = useCockpit((s) => s.setPrdSection);
  const addSection = useCockpit((s) => s.addPrdSection);

  return (
    <DocEditor
      titleId="prd-title"
      title={prd.title}
      sections={prd.sections}
      onTitle={setTitle}
      onHeading={setHeading}
      onBody={setSection}
      onAdd={addSection}
      downloadName="3-strands-dashboard-prd.md"
      copiedLabel="PRD copied as Markdown"
      tour
    />
  );
}
