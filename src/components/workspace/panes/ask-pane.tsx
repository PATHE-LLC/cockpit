"use client";

import { RefreshCwIcon } from "lucide-react";
import { TaskRow } from "@/components/home/task-checklist";
import { useCockpit } from "@/lib/store";
import { PaneScroll } from "./shared";

const SOURCES = [
  { name: "Slack", detail: "14 channels · synced 2 min ago" },
  { name: "Asana", detail: "3 projects · synced 6 min ago" },
  { name: "Email", detail: "Work inbox · synced 1 min ago" },
  { name: "Meeting notes", detail: "Yesterday's kickoff · summarised" },
  { name: "Figma", detail: "Recall file · live" },
  { name: "GitHub", detail: "acme org · 6 repos" },
];

export function AskPane() {
  const tasks = useCockpit((s) => s.tasks);
  const discarded = useCockpit((s) => s.discarded);
  const visible = tasks.filter((task) => !discarded[task.id]);
  return (
    <PaneScroll>
      <h2 className="text-sm font-medium">Context CockpitOS can see</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {SOURCES.map((s) => (
          <li key={s.name} className="py-2">
            <p className="text-sm font-medium">{s.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCwIcon className="size-3" aria-hidden /> {s.detail}
            </p>
          </li>
        ))}
      </ul>
      <h2 className="mt-6 mb-1 text-sm font-medium">Prepared tasks</h2>
      <ul className="flex flex-col">
        {visible.map((task, i) => (
          <TaskRow key={task.id} task={task} index={i} />
        ))}
      </ul>
    </PaneScroll>
  );
}
