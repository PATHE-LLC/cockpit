"use client";

import { CodeBlock, CodeBlockCopyButton } from "@/components/ai-elements/code-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GLENN_THREAD, RLS_CITATIONS, RLS_MIGRATION_SQL } from "@/lib/demo/content";
import { useCockpit } from "@/lib/store";
import { CitedText } from "../cited-text";
import { ClientOnly } from "../client-only";
import { CitationList, PaneScroll } from "./shared";

export function SlackPane({ taskId }: { taskId: string }) {
  const pane = useCockpit((s) => s.pane[taskId] ?? "sources");
  const setPane = useCockpit((s) => s.setPane);
  const slack = useCockpit((s) => s.slack);

  return (
    <Tabs value={pane} onValueChange={(v) => setPane(taskId, String(v))} className="min-h-0 flex-1 gap-0">
      <div className="border-b px-4 py-2 sm:px-5">
        <TabsList aria-label="Research panels">
          <TabsTrigger value="sources" className="px-3">Sources · {RLS_CITATIONS.length}</TabsTrigger>
          <TabsTrigger value="thread" className="px-3">Thread</TabsTrigger>
          <TabsTrigger value="sql" className="px-3">Migration</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="sources" className="flex min-h-0 flex-col">
        <PaneScroll>
          <CitationList citations={RLS_CITATIONS} />
        </PaneScroll>
      </TabsContent>
      <TabsContent value="thread" className="flex min-h-0 flex-col">
        <PaneScroll>
          <p className="mb-3 text-xs font-medium text-muted-foreground">{GLENN_THREAD.channel}</p>
          <div className="flex flex-col gap-4">
            <article className="flex gap-3">
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-xs font-semibold">G</span>
              <div>
                <p className="text-sm">
                  <span className="font-semibold">{GLENN_THREAD.author}</span>{" "}
                  <span className="text-xs text-muted-foreground">{GLENN_THREAD.time}</span>
                </p>
                <p className="mt-0.5 text-sm leading-relaxed">{GLENN_THREAD.message}</p>
              </div>
            </article>
            {slack.sent ? (
              <article className="flex gap-3">
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">A</span>
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">Abdul</span>{" "}
                    <span className="text-xs text-muted-foreground">Just now</span>
                  </p>
                  <div className="mt-0.5">
                    <CitedText text={slack.draft} citations={RLS_CITATIONS} />
                  </div>
                </div>
              </article>
            ) : (
              <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                Your reply will appear here once you send it.
              </p>
            )}
          </div>
        </PaneScroll>
      </TabsContent>
      <TabsContent value="sql" className="flex min-h-0 flex-col">
        <PaneScroll>
          <p className="mb-3 text-sm text-muted-foreground">
            Sketch to attach in the thread. Not run against staging.
          </p>
          <ClientOnly height="h-64">
            <CodeBlock code={RLS_MIGRATION_SQL} language="sql">
              <CodeBlockCopyButton />
            </CodeBlock>
          </ClientOnly>
        </PaneScroll>
      </TabsContent>
    </Tabs>
  );
}
