import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider, ThemeScript } from "@/components/theme/theme-provider";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased bg-brand-surface text-brand-navy min-h-screen">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
