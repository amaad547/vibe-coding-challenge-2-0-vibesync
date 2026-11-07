"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
}: ModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-navy/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full transform rounded-xl bg-white dark:bg-[#111C30] p-6 text-left shadow-2xl transition-all border border-slate-200 dark:border-[#26344B]",
          maxWidthMap[maxWidth]
        )}
      >
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-[#26344B]">
          <div>
            <h2 className="text-lg font-bold text-brand-navy dark:text-[#F8FAFC]">{title}</h2>
            {description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8] leading-normal">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#0B1120] hover:text-slate-600 dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-4 text-sm text-slate-700 dark:text-[#F8FAFC]">{children}</div>

        {footer && (
          <div className="mt-4 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#26344B]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
