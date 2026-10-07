import type { Metadata } from "next";
import { GeneralChat } from "@/components/workspace/general-chat";

export const metadata: Metadata = { title: "Chat" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const raw = sp.q;
  const q = typeof raw === "string" ? raw.slice(0, 500) : undefined;
  return <GeneralChat chatId={id} query={q} />;
}
