import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold tracking-wide text-brand-navy dark:text-[#F8FAFC]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-slate-400 dark:text-[#94A3B8]">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-lg border border-slate-300 dark:border-[#26344B] bg-white dark:bg-[#111C30] px-3 py-2 text-sm text-brand-navy dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]/60",
              "transition-colors focus:border-brand-primary dark:focus:border-[#4B8BFF] focus:outline-hidden focus:ring-2 focus:ring-brand-primary/20",
              "disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-[#0B1120] disabled:text-slate-400 dark:disabled:text-[#94A3B8]",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && "border-rose-500 focus:border-rose-500 focus:ring-rose-200",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="pointer-events-none absolute right-3 flex items-center text-slate-400 dark:text-[#94A3B8]">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-[#94A3B8]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
