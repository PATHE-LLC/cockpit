"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCockpit } from "@/lib/store";
import { TaskFields } from "./task-fields";

function useTouring() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const read = () => setOn(document.documentElement.hasAttribute("data-tour"));
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tour"] });
    return () => observer.disconnect();
  }, []);
  return on;
}

export function TaskDialog() {
  const form = useCockpit((s) => s.taskForm);
  const tasks = useCockpit((s) => s.tasks);
  const close = useCockpit((s) => s.closeTaskForm);
  const task = form?.taskId ? tasks.find((item) => item.id === form.taskId) : undefined;
  const open = form !== null;
  const touring = useTouring();

  return (
    <Dialog
      open={open}
      modal={!touring}
      onOpenChange={(next) => {
        if (!next && document.documentElement.hasAttribute("data-tour")) return;
        if (!next) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{form?.taskId ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription className="sr-only">
            Name, due date, and project. Description is optional.
          </DialogDescription>
        </DialogHeader>
        {open ? <TaskFields key={form?.taskId ?? "new"} task={task} onDone={close} /> : null}
      </DialogContent>
    </Dialog>
  );
}
