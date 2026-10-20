import localFont from "next/font/local";

export const geistSans = localFont({
  src: "./font-files/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

export const geistMono = localFont({
  src: "./font-files/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  fallback: ["monospace"],
});
