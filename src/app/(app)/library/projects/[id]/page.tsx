import type { Metadata } from "next";
import { ProjectPage } from "@/components/library/views";
import { projectById } from "@/lib/demo/library";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: projectById(id)?.name ?? "Project" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectPage id={id} />;
}
