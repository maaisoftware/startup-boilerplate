import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

const appName = process.env["NEXT_PUBLIC_APP_NAME"] ?? "Startup Boilerplate";
const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: appName,
    template: `%s · ${appName}`,
  },
  description:
    "Production-grade, AI-ready monorepo template for rapidly bootstrapping new client projects.",
  applicationName: appName,
  openGraph: {
    type: "website",
    url: appUrl,
    siteName: appName,
    title: appName,
    description:
      "Production-grade, AI-ready monorepo template for rapidly bootstrapping new client projects.",
  },
  twitter: {
    card: "summary_large_image",
    title: appName,
    description:
      "Production-grade, AI-ready monorepo template for rapidly bootstrapping new client projects.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
