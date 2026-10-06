"use client";

import { AlertTriangleIcon, CheckIcon, CodeIcon, MinusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ALYSSA_THREAD, FEASIBILITY, WIX_CITATIONS, type Verdict } from "@/lib/demo/content";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CitationList, PaneScroll } from "./shared";

const VERDICT: Record<Verdict, { label: string; icon: typeof CheckIcon; className: string }> = {
  native: { label: "Native", icon: CheckIcon, className: "border-brand/30 bg-brand-soft text-brand" },
  partial: { label: "Partial", icon: MinusIcon, className: "border-warn/50 bg-warn-soft text-foreground" },
  custom: { label: "Needs custom code", icon: CodeIcon, className: "border-border bg-muted text-muted-foreground" },
};

export function EmailPane({ taskId }: { taskId: string }) {
  const pane = useCockpit((s) => s.pane[taskId] ?? "feasibility");
  const setPane = useCockpit((s) => s.setPane);
  const deposit = useCockpit((s) => s.email.deposit);

  return (
    <Tabs value={pane} onValueChange={(v) => setPane(taskId, String(v))} className="min-h-0 flex-1 gap-0">
      <div className="border-b px-4 py-2 sm:px-5">
        <TabsList aria-label="Research panels">
          <TabsTrigger value="feasibility" className="px-3">Feasibility</TabsTrigger>
          <TabsTrigger value="sources" className="px-3">Sources · {WIX_CITATIONS.length}</TabsTrigger>
          <TabsTrigger value="original" className="px-3">Original email</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="feasibility" className="flex min-h-0 flex-col">
        <PaneScroll>
          <ul className="stagger-in flex flex-col gap-2.5">
            {FEASIBILITY.map((row, i) => {
              const v = VERDICT[row.verdict];
              const isDeposit = row.requirement.startsWith("Deposit");
              return (
                <li
                  key={row.requirement}
                  style={{ "--i": i } as React.CSSProperties}
                  className="rounded-xl border bg-card p-3.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-sm font-medium">{row.requirement}</h3>
                    <Badge variant="outline" className={cn("gap-1", v.className)}>
                      <v.icon className="size-3" aria-hidden />
                      {v.label}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{row.how}</p>
                  {isDeposit && deposit !== null && (
                    <p className="mt-2 text-xs text-foreground">
                      You answered: deposit {deposit ? "required" : "not required"}. The email reflects that.
                    </p>
                  )}
                  {row.verify && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-foreground">
                      <AlertTriangleIcon className="mt-px size-3.5 shrink-0 text-warn" aria-hidden />
                      <span>
                        <span className="font-medium">Verify before promising:</span> {row.verify}
                      </span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </PaneScroll>
      </TabsContent>
      <TabsContent value="sources" className="flex min-h-0 flex-col">
        <PaneScroll>
          <CitationList citations={WIX_CITATIONS} />
        </PaneScroll>
      </TabsContent>
      <TabsContent value="original" className="flex min-h-0 flex-col">
        <PaneScroll>
          <article className="rounded-xl border bg-card p-4">
            <p className="text-sm font-medium">{ALYSSA_THREAD.subject}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {ALYSSA_THREAD.from} · {ALYSSA_THREAD.time}
            </p>
            <p className="mt-3 text-sm leading-relaxed">{ALYSSA_THREAD.message}</p>
          </article>
        </PaneScroll>
      </TabsContent>
    </Tabs>
  );
}
