import type { Metadata } from "next";
import { QAWorkspace } from "@/components/qa/qa-workspace";

export const metadata: Metadata = { title: "Build & QA" };

export default function QAPage() {
  return <QAWorkspace />;
}
