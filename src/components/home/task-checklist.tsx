"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { AppChip, StatusBadge } from "@/components/task-meta";
import { Checkbox } from "@/components/ui/checkbox";
import { TASKS } from "@/lib/demo/tasks";
import type { Task } from "@/lib/demo/types";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";

export function TaskRow({ task, index = 0 }: { task: Task; index?: number }) {
  const done = useCockpit((s) => Boolean(s.completed[task.id]));
  const toggle = useCockpit((s) => s.toggleCompleted);
  const status = done ? "done" : task.status;
  return (
    <li
      style={{ "--i": index } as React.CSSProperties}
      className="group/row relative flex items-start gap-3 rounded-xl px-2 py-3 transition-colors duration-150 hover:bg-accent/60 sm:px-3"
    >
      <Checkbox
        checked={done}
        onCheckedChange={(v) => toggle(task.id, Boolean(v))}
        aria-label={`Mark “${task.title}” as done`}
        className="relative z-10 mt-1 size-5 rounded-md"
      />
      <Link
        href={`/tasks/${task.id}`}
        className="min-w-0 flex-1 rounded-md outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-3 focus-visible:after:ring-ring/50 focus-visible:after:rounded-xl"
      >
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              "text-[15px] leading-snug font-medium",
              done && "text-muted-foreground line-through decoration-muted-foreground/50",
            )}
          >
            {task.title}
          </span>
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <StatusBadge status={status} label={done ? "Done" : task.statusDetail} className="max-w-full" />
          <AppChip task={task} />
          <span className="text-xs text-muted-foreground">Due {task.due}</span>
        </span>
      </Link>
      <ArrowRightIcon
        aria-hidden
        className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-[opacity,transform] duration-150 group-hover/row:translate-x-0.5 group-hover/row:opacity-100 motion-reduce:transition-none"
      />
    </li>
  );
}

export function TaskChecklist() {
  const completed = useCockpit((s) => s.completed);
  const doneCount = TASKS.filter((t) => completed[t.id]).length;
  return (
    <section aria-labelledby="checklist-h">
      <div className="mb-1 flex items-baseline justify-between px-2 sm:px-3">
        <h2 id="checklist-h" className="text-sm font-medium text-muted-foreground">
          Today&rsquo;s checklist
        </h2>
        <p className="tabular text-xs text-muted-foreground" aria-live="polite">
          {doneCount} of {TASKS.length} done
        </p>
      </div>
      <ul className="stagger-in flex flex-col">
        {TASKS.map((t, i) => (
          <TaskRow key={t.id} task={t} index={i} />
        ))}
      </ul>
    </section>
  );
}
