import type { Metadata } from "next";
import { ClientsPage } from "@/components/library/views";

export const metadata: Metadata = { title: "Clients" };

export default function Page() {
  return <ClientsPage />;
}
