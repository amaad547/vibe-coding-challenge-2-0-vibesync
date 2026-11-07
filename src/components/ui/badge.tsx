import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "primary";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "neutral",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    primary: "bg-blue-50 dark:bg-blue-950/50 text-brand-primary dark:text-[#4B8BFF] border-blue-200 dark:border-blue-900/60",
    success: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60",
    warning: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60",
    danger: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60",
    info: "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/60",
    neutral: "bg-slate-100 dark:bg-[#0B1120] text-slate-700 dark:text-[#94A3B8] border-slate-200 dark:border-[#26344B]",
  };

  const dotColors = {
    primary: "bg-brand-primary",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-cyan-500",
    neutral: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} />}
      {children}
    </span>
  );
}
