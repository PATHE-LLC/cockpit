"use client";

import { ArchiveIcon, ArrowRightIcon, PencilIcon, PlusIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { APP_META } from "@/components/task-meta";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { formatDue } from "@/components/tasks/task-fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/lib/demo/types";
import { playClick, playCue } from "@/lib/sounds";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";

function DashedPlus() {
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-md border border-dashed border-muted-foreground/40 text-muted-foreground transition-colors group-hover/new:border-foreground/40 group-hover/new:text-foreground">
      <PlusIcon className="size-3.5" aria-hidden />
    </span>
  );
}

export function NewTaskInline({ className }: { className?: string }) {
  const addTask = useCockpit((s) => s.addTask);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [focusTick, setFocusTick] = useState(0);
  const slotRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    slotRef.current?.scrollIntoView({ block: "nearest" });
  }, [open, focusTick]);

  const close = () => {
    setTitle("");
    setOpen(false);
  };

  const leaveIfEmpty = (next: EventTarget | null) => {
    if (next instanceof Node && slotRef.current?.contains(next)) return;
    if (title.trim()) return;
    close();
  };

  if (open) {
    return (
      <div
        ref={slotRef}
        onBlur={(e) => leaveIfEmpty(e.relatedTarget)}
        className={cn(
          "flex items-start gap-3 rounded-xl bg-muted/30 px-2 py-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 sm:px-3",
          className,
        )}
      >
        <DashedPlus />
        <form
          className="flex min-w-0 flex-1 items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const next = title.trim();
            if (!next) return;
            addTask({ title: next, summary: "", due: "", project: "" });
            playClick();
            setTitle("");
            inputRef.current?.focus();
            setFocusTick((n) => n + 1);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            close();
          }}
        >
          <label htmlFor="inline-task-name" className="sr-only">
            New task
          </label>
          <input
            ref={inputRef}
            id="inline-task-name"
            name="name"
            autoComplete="off"
            value={title}
            placeholder="New task"
            onChange={(e) => setTitle(e.target.value)}
            className="m-0 h-5 min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] leading-5 font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => {
              playClick();
              close();
            }}
            className="shrink-0 text-[15px] leading-5 text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="shrink-0 text-[15px] leading-5 font-medium outline-none hover:text-foreground focus-visible:text-foreground"
          >
            Add
          </button>
        </form>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        playClick();
        setOpen(true);
      }}
      className={cn(
        "group/new flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-3",
        className,
      )}
    >
      <DashedPlus />
      <span className="text-[15px] leading-5 text-muted-foreground transition-colors group-hover/new:text-foreground">
        New task
      </span>
    </button>
  );
}

export function TaskRow({
  task,
  index = 0,
  compact = false,
  discarded = false,
  instant = false,
}: {
  task: Task;
  index?: number;
  compact?: boolean;
  discarded?: boolean;
  /** Skip the list entrance delay. Used for a task just added on this page. */
  instant?: boolean;
}) {
  const done = useCockpit((s) => Boolean(s.completed[task.id]));
  const toggle = useCockpit((s) => s.toggleCompleted);
  const discardTask = useCockpit((s) => s.discardTask);
  const restoreTask = useCockpit((s) => s.restoreTask);
  const deleteTask = useCockpit((s) => s.deleteTask);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const openTaskForm = useCockpit((s) => s.openTaskForm);
  const source = task.project || (task.origin === "yours" ? "" : APP_META[task.app].label);
  const meta = [source, task.due ? formatDue(task.due) : ""].filter(Boolean).join(" · ");

  return (
    <li
      style={
        {
          "--i": index,
          ...(instant ? { animation: "none" } : {}),
        } as React.CSSProperties
      }
      className="group/row relative flex flex-col rounded-xl px-2 py-3 transition-colors duration-150 hover:bg-accent/60 sm:px-3"
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={done}
          onCheckedChange={(v) => {
            toggle(task.id, Boolean(v));
            playClick();
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
              onClick={() => setConfirmingDelete(true)}
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
      <DeleteTaskDialog
        open={confirmingDelete}
        taskTitle={task.title}
        onOpenChange={setConfirmingDelete}
        onConfirm={() => deleteTask(task.id)}
      />
    </li>
  );
}

export function useArrivedTaskIds(ids: string[]) {
  const arrived = useRef<Set<string> | null>(null);
  if (arrived.current === null) arrived.current = new Set(ids);
  return arrived.current;
}

export function TaskChecklist({ compact = false }: { compact?: boolean }) {
  const tasks = useCockpit((s) => s.tasks);
  const discarded = useCockpit((s) => s.discarded);
  const completed = useCockpit((s) => s.completed);
  const visible = tasks.filter((task) => !discarded[task.id]);
  const doneCount = visible.filter((task) => completed[task.id]).length;
  const arrived = useArrivedTaskIds(tasks.map((task) => task.id));
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
            nativeButton={false}
            render={<Link href="/tasks" />}
          >
            View all
          </Button>
          <p className="tabular text-xs text-muted-foreground" aria-live="polite">
            {doneCount} of {visible.length} done
          </p>
        </div>
      </div>
      <ul className="stagger-in flex flex-col">
        {visible.map((task, i) => (
          <TaskRow key={task.id} task={task} index={i} compact={compact} instant={!arrived.has(task.id)} />
        ))}
        <li style={{ "--i": visible.length } as React.CSSProperties}>
          <NewTaskInline />
        </li>
      </ul>
    </section>
  );
}
