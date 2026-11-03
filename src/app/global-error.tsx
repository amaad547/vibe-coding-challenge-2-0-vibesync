"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Global uncaught error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">System Error</h2>
          <p className="mt-2 text-xs text-slate-600">
            A critical system error occurred. Please refresh the page to restore service.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" /> Reload SportSync
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
