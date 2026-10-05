"use client";

import { InboxIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { TaskRow } from "@/components/home/task-checklist";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TASKS } from "@/lib/demo/tasks";
import { useCockpit } from "@/lib/store";

type Filter = "all" | "you" | "done";

export function TasksList() {
  const completed = useCockpit((s) => s.completed);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TASKS.filter((t) => {
      const done = Boolean(completed[t.id]);
      if (filter === "done" && !done) return false;
      if (filter === "you" && done) return false;
      if (!q) return true;
      return `${t.title} ${t.summary} ${t.requester}`.toLowerCase().includes(q);
    });
  }, [completed, filter, query]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">All tasks</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Everything CockpitOS prepared or is carrying forward for you.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList aria-label="Filter tasks">
            <TabsTrigger value="all" className="px-3">All</TabsTrigger>
            <TabsTrigger value="you" className="px-3">Needs you</TabsTrigger>
            <TabsTrigger value="done" className="px-3">Done</TabsTrigger>
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
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
          <InboxIcon className="size-6 text-muted-foreground" aria-hidden />
          <div>
            <p className="font-medium">
              {filter === "done" && !query ? "Nothing finished yet" : "No tasks match"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === "done" && !query
                ? "Tick off a task on Today, or send a reply from a workspace, and it shows up here."
                : "Try a different filter or search term."}
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
        <ul className="stagger-in mt-4 flex flex-col divide-y rounded-2xl border bg-card p-1">
          {visible.map((t, i) => (
            <TaskRow key={t.id} task={t} index={i} />
          ))}
        </ul>
      )}
    </div>
  );
}
