import * as React from "react";
import { cn } from "@/lib/utils";

export const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-lg border border-slate-200 dark:border-[#26344B] bg-white dark:bg-[#111C30]">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm text-left", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-slate-50/80 dark:bg-[#0B1120]/70 border-b border-slate-200 dark:border-[#26344B] text-xs font-semibold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider",
      className
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("divide-y divide-slate-100 dark:divide-[#26344B]/60", className)} {...props} />
));
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-colors hover:bg-slate-50/70 dark:hover:bg-[#0B1120]/50 data-[state=selected]:bg-slate-100 dark:data-[state=selected]:bg-[#0B1120]",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-4 text-left align-middle font-bold text-slate-600 dark:text-[#94A3B8] [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle text-brand-navy dark:text-[#F8FAFC] [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export function TableEmpty({
  message = "No records found",
  description,
  action,
}: {
  message?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#26344B] flex items-center justify-center mb-3">
        <span className="text-xl">📋</span>
      </div>
      <p className="text-sm font-bold text-slate-700 dark:text-[#F8FAFC]">{message}</p>
      {description && <p className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
