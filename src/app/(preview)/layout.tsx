import type { Metadata } from "next";
import { geistMono, geistSans } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "3 Strands Dashboard (prototype)",
  robots: { index: false },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
