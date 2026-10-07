import type { Metadata } from "next";
import { ProjectsPage } from "@/components/library/views";

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return <ProjectsPage />;
}
