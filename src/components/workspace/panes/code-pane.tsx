"use client";

import { CheckCircle2Icon, FileCodeIcon } from "lucide-react";
import { useState } from "react";
import { CodeBlock, CodeBlockCopyButton } from "@/components/ai-elements/code-block";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DANA_REQUEST, MODEL_6D_CHECKS } from "@/lib/demo/content";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ClientOnly } from "../client-only";
import { PaneScroll } from "./shared";

export function CodePane({ taskId }: { taskId: string }) {
  const pane = useCockpit((s) => s.pane[taskId] ?? "diff");
  const setPane = useCockpit((s) => s.setPane);
  const { diff, approval } = useCockpit((s) => s.code);
  const [active, setActive] = useState(0);
  const file = diff[Math.min(active, diff.length - 1)];
  const adds = diff.reduce((n, f) => n + f.additions, 0);

  return (
    <Tabs value={pane} onValueChange={(v) => setPane(taskId, String(v))} className="min-h-0 flex-1 gap-0">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2 sm:px-5">
        <TabsList aria-label="Code change panels">
          <TabsTrigger value="diff" className="px-3">Changes</TabsTrigger>
          <TabsTrigger value="checks" className="px-3">Checks · 4</TabsTrigger>
          <TabsTrigger value="request" className="px-3">Request</TabsTrigger>
        </TabsList>
        <p className="tabular hidden text-xs text-muted-foreground sm:block">
          {diff.length} files · <span className="text-brand">+{adds}</span>
        </p>
      </div>
      <TabsContent value="diff" className="flex min-h-0 flex-col">
        <PaneScroll>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <code className="rounded bg-muted px-1.5 py-0.5">cursor/model-6d-self-service-form</code>
            <span className="text-muted-foreground">
              {approval === "approved" ? "Pushed · draft PR #214 (simulated)" : "Sandbox only · not pushed"}
            </span>
          </div>
          <div role="group" aria-label="Changed files" className="mb-3 flex flex-wrap gap-1.5">
            {diff.map((f, i) => (
              <Button
                key={f.path}
                aria-pressed={i === active}
                variant={i === active ? "secondary" : "ghost"}
                size="sm"
                className={cn("max-w-full justify-start gap-1.5 font-mono text-xs", i !== active && "text-muted-foreground")}
                onClick={() => setActive(i)}
              >
                <FileCodeIcon aria-hidden />
                <span className="truncate">{f.path.split("/").pop()}</span>
                <span className="tabular text-brand">+{f.additions}</span>
              </Button>
            ))}
          </div>
          <p className="mb-2 font-mono text-xs text-muted-foreground">{file.path}</p>
          <ClientOnly height="h-64">
            <CodeBlock code={file.patch} language="diff" showLineNumbers>
              <CodeBlockCopyButton />
            </CodeBlock>
          </ClientOnly>
        </PaneScroll>
      </TabsContent>
      <TabsContent value="checks" className="flex min-h-0 flex-col">
        <PaneScroll>
          <ul className="stagger-in flex flex-col gap-2.5">
            {MODEL_6D_CHECKS.map((c, i) => (
              <li
                key={c.name}
                style={{ "--i": i } as React.CSSProperties}
                className="flex items-center gap-3 rounded-xl border bg-card p-3.5"
              >
                <CheckCircle2Icon className="size-5 shrink-0 text-brand" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.detail}</p>
                </div>
                <span className="text-sm font-medium text-brand">{c.result}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Ran in an isolated sandbox. Secrets, schema migrations and production data were not available to this run.
          </p>
        </PaneScroll>
      </TabsContent>
      <TabsContent value="request" className="flex min-h-0 flex-col">
        <PaneScroll>
          <article className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">
              {DANA_REQUEST.author} · {DANA_REQUEST.source}
            </p>
            <p className="mt-2 text-sm leading-relaxed">{DANA_REQUEST.message}</p>
          </article>
        </PaneScroll>
      </TabsContent>
    </Tabs>
  );
}
