import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-brand-primary text-white hover:bg-brand-primaryHover shadow-xs active:bg-brand-primaryHover",
      secondary:
        "bg-brand-navy dark:bg-[#1e2d48] text-white hover:bg-brand-navyLight dark:hover:bg-[#263859] shadow-xs active:bg-brand-navyLight",
      outline:
        "border border-slate-300 dark:border-[#26344B] bg-white dark:bg-[#111C30] text-brand-navy dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] shadow-xs active:bg-slate-100",
      ghost:
        "text-slate-700 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#111C30] hover:text-brand-navy dark:hover:text-[#F8FAFC] active:bg-slate-200 dark:active:bg-[#0B1120]",
      danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-xs active:bg-rose-800",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-current" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
