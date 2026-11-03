import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SportSync — Your Academy. Your Performance. Your Future.",
    template: "%s | SportSync",
  },
  description:
    "SportSync is the modern sports academy desk for managing rosters, immutable session attendance, match records, and trial readiness.",
  icons: {
    icon: "/images/sportsync-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-brand-surface text-brand-navy min-h-screen">{children}</body>
    </html>
  );
}
