import type { Metadata } from "next";
import { TasksList } from "@/components/tasks-list";

export const metadata: Metadata = { title: "All tasks" };

export default function TasksPage() {
  return <TasksList />;
}
