import type { Metadata } from "next";
import { LibraryHome } from "@/components/library/views";

export const metadata: Metadata = { title: "Library" };

export default function Page() {
  return <LibraryHome />;
}
