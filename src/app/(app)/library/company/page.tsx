import type { Metadata } from "next";
import { CompanyPage } from "@/components/library/views";

export const metadata: Metadata = { title: "Team" };

export default function Page() {
  return <CompanyPage />;
}
