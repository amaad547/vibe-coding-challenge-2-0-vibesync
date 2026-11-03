import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-surface p-6 sm:p-12">
      <header className="flex justify-center sm:justify-start">
        <SportSyncLogo size="md" href="/" />
      </header>

      <main className="max-w-md mx-auto text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
          403 Access Forbidden
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-brand-navy">
          Unauthorized Access
        </h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Your current account role does not have authorization to view this area. SportSync
          enforces strict role-based boundaries between Coaches, Players, and Scouts.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-primaryHover transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Sign In with Another Account
          </Link>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500">
        SportSync &bull; Dumka Sports Academy Management Desk
      </footer>
    </div>
  );
}
