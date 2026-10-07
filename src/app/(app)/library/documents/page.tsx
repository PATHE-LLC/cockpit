import type { Metadata } from "next";
import { DocumentsPage } from "@/components/library/views";

export const metadata: Metadata = { title: "Documents" };

export default function Page() {
  return <DocumentsPage />;
}
