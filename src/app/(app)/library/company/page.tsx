import type { Metadata } from "next";
import { CompanyPage } from "@/components/library/views";

export const metadata: Metadata = { title: "Company" };

export default function Page() {
  return <CompanyPage />;
}
