"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-brand-navy">Something went wrong</h2>
        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          An unexpected error occurred while loading this view. You can attempt to reload the view
          or return to the overview.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            variant="primary"
            size="md"
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Try Again
          </Button>
          <Button onClick={() => (window.location.href = "/")} variant="outline" size="md">
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
