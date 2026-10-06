"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Task } from "@/lib/demo/types";
import { useCockpit } from "@/lib/store";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatDue(due: string) {
  const match = ISO_DATE.exec(due);
  if (!match) return due;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dateInputValue(due: string | undefined) {
  return due && ISO_DATE.test(due) ? due : "";
}

export function TaskFields({
  task,
  onDone,
}: {
  task?: Task;
  onDone: () => void;
}) {
  const addTask = useCockpit((s) => s.addTask);
  const updateTask = useCockpit((s) => s.updateTask);
  const [title, setTitle] = useState(task?.title ?? "");
  const [due, setDue] = useState(dateInputValue(task?.due));
  const [project, setProject] = useState(task?.project ?? "");
  const [summary, setSummary] = useState(task?.summary ?? "");

  const save = () => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    const previousDue = task?.due ?? "";
    const nextDue = due || (previousDue && !ISO_DATE.test(previousDue) ? previousDue : "");
    const patch = {
      title: nextTitle,
      due: nextDue,
      project: project.trim(),
      summary: summary.trim(),
    };
    if (task) updateTask(task.id, patch);
    else addTask(patch);
    onDone();
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="task-name">Name</Label>
        <Input
          id="task-name"
          name="name"
          autoComplete="off"
          autoFocus
          required
          value={title}
          placeholder="Name"
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="task-due">Due date</Label>
          <Input
            id="task-due"
            name="due"
            type="date"
            autoComplete="off"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="task-project">Project</Label>
          <Input
            id="task-project"
            name="project"
            autoComplete="off"
            value={project}
            placeholder="Project"
            onChange={(e) => setProject(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="task-description">
          Description <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="task-description"
          name="description"
          autoComplete="off"
          rows={3}
          value={summary}
          placeholder="Description"
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{task ? "Save" : "Add task"}</Button>
      </div>
    </form>
  );
}
