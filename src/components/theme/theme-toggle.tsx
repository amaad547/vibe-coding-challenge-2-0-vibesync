"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  align?: "left" | "right";
  variant?: "button" | "compact";
}

export function ThemeToggle({
  className,
  variant = "button",
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleToggle = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer shadow-2xs",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary active:scale-95",
        "border-slate-200 dark:border-[#26344B] bg-white dark:bg-[#111C30] hover:bg-slate-50 dark:hover:bg-[#0B1120]",
        "text-slate-600 dark:text-[#94A3B8] hover:text-brand-navy dark:hover:text-[#F8FAFC]",
        variant === "button" ? "h-9 w-9 p-2" : "h-8 w-8 p-1.5",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
