"use client";

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { useCockpit } from "@/lib/store";

export function PrdPane() {
  const content = useCockpit((s) => s.prd.content);
  const setContent = useCockpit((s) => s.setPrdContent);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SimpleEditor content={content} onUpdate={setContent} tour />
    </div>
  );
}
