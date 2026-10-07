import type { Metadata } from "next";
import { ClientPage } from "@/components/library/views";
import { clientById } from "@/lib/demo/library";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: clientById(id)?.name ?? "Client" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientPage id={id} />;
}
