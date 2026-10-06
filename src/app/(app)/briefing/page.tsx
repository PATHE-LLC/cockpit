import type { Metadata } from "next";
import { BriefingDetail } from "@/components/home/briefing-detail";

export const metadata: Metadata = { title: "Briefing" };

export default function BriefingPage() {
  return <BriefingDetail />;
}
