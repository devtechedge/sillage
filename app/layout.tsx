import type { Metadata, Viewport } from "next";
import { env } from "@/lib/env";
import "@fontsource/italiana/400.css";
import "@fontsource/karla/400.css";
import "@fontsource/karla/500.css";
import "@fontsource/karla/600.css";
import "@fontsource/karla/700.css";
import "@fontsource/azeret-mono/400.css";
import "@fontsource/azeret-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "SILLAGE / Maison Verre formula room",
    template: "%s / SILLAGE",
  },
  description:
    "The private formula room of Maison Verre. Compose in parts per thousand, keep every trial, approve one version, and follow the materials into the bottle.",
  openGraph: {
    title: "SILLAGE / Maison Verre formula room",
    description:
      "A fragrance house's private formula room. Versioned compositions, evaluator trials, guarded approvals and traceable batches.",
    url: env.siteUrl,
    siteName: "SILLAGE",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "SILLAGE, a fragrance house formula room" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SILLAGE / Maison Verre formula room",
    description: "Versioned formulas, evaluator trials and traceable batches.",
    images: ["/og.png"],
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#171311",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
