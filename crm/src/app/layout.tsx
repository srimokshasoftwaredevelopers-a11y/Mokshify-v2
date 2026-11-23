import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Mokshify Desk", template: "%s · Mokshify Desk" },
  description: "Mokshify's internal CRM.",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/favicon-32.png", apple: "/icons/icon-180.png" },
  appleWebApp: { capable: true, title: "Desk", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#2A0A12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // every page renders per request: the strict CSP needs a fresh nonce on each one (even 404 and 403)
  await connection();
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
