"use client";

import { FileTextIcon, LayoutDashboardIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCockpit } from "@/lib/store";
import { PrdPane } from "./prd-pane";
import { PrototypePane } from "./prototype-pane";

export function ThreeStrandsPane({ taskId }: { taskId: string }) {
  const pane = useCockpit((s) => s.pane[taskId] ?? "prototype");
  const setPane = useCockpit((s) => s.setPane);
  const version = useCockpit((s) => s.prototype.current);
  return (
    <Tabs value={pane} onValueChange={(v) => setPane(taskId, String(v))} className="min-h-0 flex-1 gap-0">
      <div className="border-b px-4 py-2 sm:px-5">
        <TabsList aria-label="Deliverables">
          <TabsTrigger value="prototype" className="gap-1.5 px-3">
            <LayoutDashboardIcon aria-hidden /> Prototype · v{version}
          </TabsTrigger>
          <TabsTrigger value="prd" className="gap-1.5 px-3">
            <FileTextIcon aria-hidden /> PRD
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="prototype" className="flex min-h-0 flex-col">
        <PrototypePane />
      </TabsContent>
      <TabsContent value="prd" className="flex min-h-0 flex-col">
        <PrdPane />
      </TabsContent>
    </Tabs>
  );
}
