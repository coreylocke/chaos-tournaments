import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StickyMobileCta from "@/components/StickyMobileCta";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chaostournaments.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Chaos Tournaments",
    template: "%s | Chaos Tournaments",
  },
  description:
    "Register your team, fund your entry, and compete in Chaos Tournaments — PC and console esports tournaments and grudge matches.",
  icons: {
    icon: [
      { url: "/icons/logo-gold-favicon.svg", type: "image/svg+xml" },
      { url: "/icons/logo-gold-favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/logo-gold-favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/icons/logo-gold-favicon-apple-touch-180x180.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Chaos Tournaments",
    description:
      "Register your team, fund your entry, and compete in Chaos Tournaments.",
    url: SITE_URL,
    siteName: "Chaos Tournaments",
    images: [{ url: "/logo-gold-website-og-1200x630.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chaos Tournaments",
    description:
      "Register your team, fund your entry, and compete in Chaos Tournaments.",
    images: ["/logo-gold-x-header-1500x500.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-chaos-black font-body text-chaos-white antialiased">
        <Header />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <StickyMobileCta />
      </body>
    </html>
  );
}
