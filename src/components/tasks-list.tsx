"use client";

import { ArchiveIcon, CheckIcon, InboxIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TaskRow } from "@/components/home/task-checklist";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCockpit } from "@/lib/store";

type Filter = "all" | "you" | "done" | "discarded";

function TasksListInner() {
  const tasks = useCockpit((s) => s.tasks);
  const completed = useCockpit((s) => s.completed);
  const discarded = useCockpit((s) => s.discarded);
  const params = useSearchParams();
  const openTaskForm = useCockpit((s) => s.openTaskForm);
  const [filter, setFilter] = useState<Filter>(params.get("archive") === "1" ? "discarded" : "all");
  const [query, setQuery] = useState("");

  const openedNew = useRef(false);
  useEffect(() => {
    if (openedNew.current || params.get("new") !== "1") return;
    openedNew.current = true;
    openTaskForm();
  }, [openTaskForm, params]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const isDiscarded = Boolean(discarded[task.id]);
      const done = Boolean(completed[task.id]);
      if (filter === "discarded") {
        if (!isDiscarded) return false;
      } else if (isDiscarded) {
        return false;
      } else if (filter === "done" && !done) {
        return false;
      } else if (filter === "you" && done) {
        return false;
      }
      if (!q) return true;
      return `${task.title} ${task.summary} ${task.project ?? ""} ${task.requester}`.toLowerCase().includes(q);
    });
  }, [completed, discarded, filter, query, tasks]);

  return (
    <div className="edge-scroll min-h-0 flex-1 overflow-y-auto">
      <div className="page-column py-8 sm:py-12">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {filter === "discarded" ? "Archive" : "All tasks"}
          </h1>
          <Button variant="ghost" size="sm" onClick={() => openTaskForm()}>
            <PlusIcon aria-hidden /> New task
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-tour="filters">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList aria-label="Filter tasks">
              <TabsTrigger value="all" className="px-3">All</TabsTrigger>
              <TabsTrigger value="you" className="px-3">Needs you</TabsTrigger>
              <TabsTrigger value="done" aria-label="Done" className="px-2.5">
                <CheckIcon aria-hidden />
                {filter === "done" ? "Done" : null}
              </TabsTrigger>
              <TabsTrigger value="discarded" aria-label="Archive" className="px-2.5">
                <ArchiveIcon aria-hidden />
                {filter === "discarded" ? "Archive" : null}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <InputGroup className="sm:max-w-64">
            <InputGroupAddon>
              <SearchIcon aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              name="task-search"
              autoComplete="off"
              spellCheck={false}
              aria-label="Search tasks"
              placeholder="Search tasks…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
        </div>

        {visible.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-foreground/10 bg-muted/50 p-10 text-center">
            <InboxIcon className="size-6 text-muted-foreground" aria-hidden />
            <div>
              <p className="font-medium">
                {filter === "done" && !query
                  ? "Nothing finished yet"
                  : filter === "discarded" && !query
                    ? "Nothing in the archive"
                    : "No tasks match"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === "discarded" && !query
                  ? "Archived tasks stay here until you restore or delete them."
                  : filter === "done" && !query
                    ? "Nothing marked done."
                    : "No matches."}
              </p>
            </div>
            {(query || filter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <ul className="stagger-in mt-4 flex flex-col">
            {visible.map((task, i) => (
              <TaskRow key={task.id} task={task} index={i} discarded={filter === "discarded"} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function TasksList() {
  return (
    <Suspense fallback={<div className="page-column py-12 text-sm text-muted-foreground">Loading tasks</div>}>
      <TasksListInner />
    </Suspense>
  );
}
