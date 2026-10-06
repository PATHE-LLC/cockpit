"use client";

import { ArchiveIcon, ArrowRightIcon, PencilIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { APP_META } from "@/components/task-meta";
import { formatDue } from "@/components/tasks/task-fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/lib/demo/types";
import { playCue } from "@/lib/sounds";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";

export function TaskRow({
  task,
  index = 0,
  compact = false,
  discarded = false,
}: {
  task: Task;
  index?: number;
  compact?: boolean;
  discarded?: boolean;
}) {
  const done = useCockpit((s) => Boolean(s.completed[task.id]));
  const toggle = useCockpit((s) => s.toggleCompleted);
  const discardTask = useCockpit((s) => s.discardTask);
  const restoreTask = useCockpit((s) => s.restoreTask);
  const deleteTask = useCockpit((s) => s.deleteTask);
  const openTaskForm = useCockpit((s) => s.openTaskForm);
  const meta = [task.project || APP_META[task.app].label, task.due ? formatDue(task.due) : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      style={{ "--i": index } as React.CSSProperties}
      className="group/row relative flex flex-col rounded-xl px-2 py-3 transition-colors duration-150 hover:bg-accent/60 sm:px-3"
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={done}
          onCheckedChange={(v) => {
            const next = Boolean(v);
            toggle(task.id, next);
            if (next) playCue("done");
          }}
          aria-label={`Mark “${task.title}” as done`}
          className="relative z-10 size-5 shrink-0 rounded-md"
        />
        <Link
          href={`/tasks/${task.id}`}
          onClick={() => playCue("open-task")}
          className="min-w-0 flex-1 rounded-md outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-3 focus-visible:after:ring-ring/50 focus-visible:after:rounded-xl"
        >
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className={cn(
                "text-[15px] leading-5 font-medium",
                done && "text-muted-foreground line-through decoration-muted-foreground/50",
              )}
            >
              {task.title}
            </span>
            {!compact && meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
          </span>
        </Link>
        <div className="relative z-10 flex shrink-0 items-center">
          {!compact && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Edit “${task.title}”`}
              className="text-muted-foreground opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
              onClick={() => openTaskForm(task.id)}
            >
              <PencilIcon aria-hidden />
            </Button>
          )}
          {discarded ? (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Restore “${task.title}”`}
              className="text-muted-foreground"
              onClick={() => {
                restoreTask(task.id);
                playCue("restore");
              }}
            >
              <RotateCcwIcon aria-hidden />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Archive “${task.title}”`}
              className="text-muted-foreground opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
              onClick={() => {
                discardTask(task.id);
                playCue("discard");
              }}
            >
              <ArchiveIcon aria-hidden />
            </Button>
          )}
          {discarded && !compact ? (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Delete “${task.title}”`}
              className="text-muted-foreground"
              onClick={() => deleteTask(task.id)}
            >
              <Trash2Icon aria-hidden />
            </Button>
          ) : null}
          <ArrowRightIcon
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-[opacity,transform] duration-150 group-hover/row:translate-x-0.5 group-hover/row:opacity-100 motion-reduce:transition-none"
            />
        </div>
      </div>
    </li>
  );
}

export function TaskChecklist({ compact = false }: { compact?: boolean }) {
  const tasks = useCockpit((s) => s.tasks);
  const discarded = useCockpit((s) => s.discarded);
  const completed = useCockpit((s) => s.completed);
  const openTaskForm = useCockpit((s) => s.openTaskForm);
  const visible = tasks.filter((task) => !discarded[task.id]);
  const doneCount = visible.filter((task) => completed[task.id]).length;
  return (
    <section aria-labelledby="checklist-h" data-tour="checklist">
      <div className="mb-1 flex items-baseline justify-between gap-3 px-2 sm:px-3">
        <h2 id="checklist-h" className="text-sm font-medium text-muted-foreground">
          Checklist
        </h2>
        <div className="flex items-baseline gap-3">
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            onClick={() => openTaskForm()}
          >
            New task
          </Button>
          <p className="tabular text-xs text-muted-foreground" aria-live="polite">
            {doneCount} of {visible.length} done
          </p>
        </div>
      </div>
      <ul className="stagger-in flex flex-col">
        {visible.map((task, i) => (
          <TaskRow key={task.id} task={task} index={i} compact={compact} />
        ))}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/tasks" />}
        className="mt-1 w-full justify-start rounded-xl pl-10 text-muted-foreground sm:pl-11"
      >
        View all tasks
      </Button>
    </section>
  );
}
