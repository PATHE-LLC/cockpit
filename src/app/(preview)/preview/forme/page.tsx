import type { Metadata } from "next";
import { FormeStorefront } from "@/components/qa/contact-preview";

export const metadata: Metadata = {
  title: "Forme · Contact",
  robots: { index: false },
};

export default async function FormePage({
  searchParams,
}: PageProps<"/preview/forme">) {
  const params = await searchParams;
  return <FormeStorefront build={params.build === "13" ? 13 : 12} />;
}
