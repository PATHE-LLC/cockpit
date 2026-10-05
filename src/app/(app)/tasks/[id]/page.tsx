import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace/workspace";
import { TASK_BY_ID } from "@/lib/demo/tasks";

export async function generateMetadata({ params }: PageProps<"/tasks/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: TASK_BY_ID[id]?.title ?? "Ask CockpitOS" };
}

export default async function TaskPage({ params, searchParams }: PageProps<"/tasks/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  if (!TASK_BY_ID[id] && id !== "ask") notFound();
  const q = typeof sp.q === "string" ? sp.q.slice(0, 500) : undefined;
  return <Workspace taskId={id} query={q} />;
}
