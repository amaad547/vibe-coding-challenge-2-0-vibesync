"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, AlertCircle, Clock, ShieldX, UserPlus, Mail, Lock } from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorStatus, setErrorStatus] = React.useState<{
    type: "ERROR" | "PENDING" | "REJECTED";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorStatus(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const code = data.error?.code;
        if (code === "ACCOUNT_PENDING") {
          setErrorStatus({
            type: "PENDING",
            message:
              "Your athlete registration is currently in the verification queue. The head coach will review and approve your account shortly.",
          });
        } else if (code === "ACCOUNT_REJECTED") {
          setErrorStatus({
            type: "REJECTED",
            message:
              "Your registration application was not approved by the academy. Please contact the head coach.",
          });
        } else {
          setErrorStatus({
            type: "ERROR",
            message:
              data.error?.message || "Invalid email or password. Please verify your credentials.",
          });
        }
        setIsLoading(false);
        return;
      }

      const role = data.data.user.role;
      if (role === "COACH") {
        router.push("/coach");
      } else if (role === "PLAYER") {
        router.push("/player");
      } else if (role === "SCOUT") {
        router.push("/scout");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      setErrorStatus({
        type: "ERROR",
        message: "Unable to connect to the server. Please check your connection and retry.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative max-w-md w-full mx-auto my-6">
      {/* Ambient Glow behind the Login Card */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/10 blur-xl opacity-75 pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative rounded-2xl border border-slate-200/90 dark:border-[#26344B] bg-white/95 dark:bg-[#111C30]/95 p-8 shadow-xl backdrop-blur-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-brand-primary dark:text-[#4B8BFF] mb-3 shadow-inner">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-brand-navy">
            Sign In to SportSync
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
            Access your coach desk, player portal, or scouting registry
          </p>
        </div>

        {errorStatus && (
          <div
            className={`mb-6 rounded-xl p-4 flex items-start gap-3 text-xs leading-relaxed transition-all ${
              errorStatus.type === "PENDING"
                ? "bg-amber-50/90 border border-amber-200 text-amber-800"
                : errorStatus.type === "REJECTED"
                  ? "bg-rose-50/90 border border-rose-200 text-rose-800"
                  : "bg-red-50/90 border border-red-200 text-red-800"
            }`}
          >
            {errorStatus.type === "PENDING" ? (
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : errorStatus.type === "REJECTED" ? (
              <ShieldX className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">
                {errorStatus.type === "PENDING"
                  ? "Verification Pending"
                  : errorStatus.type === "REJECTED"
                    ? "Application Rejected"
                    : "Sign In Failed"}
              </p>
              <p className="mt-0.5">{errorStatus.message}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                placeholder="name@dumkasports.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-[#26344B] bg-white/90 dark:bg-[#0B1120]/90 pl-10 pr-3 py-2 text-sm text-brand-navy dark:text-[#F8FAFC] shadow-2xs transition-all placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]/60 focus:border-brand-primary dark:focus:border-[#4B8BFF] focus:bg-white dark:focus:bg-[#0B1120] focus:outline-hidden focus:ring-3 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94A3B8]">
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-[#94A3B8]">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-[#26344B] bg-white/90 dark:bg-[#0B1120]/90 pl-10 pr-3 py-2 text-sm text-brand-navy dark:text-[#F8FAFC] shadow-2xs transition-all placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]/60 focus:border-brand-primary dark:focus:border-[#4B8BFF] focus:bg-white dark:focus:bg-[#0B1120] focus:outline-hidden focus:ring-3 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all rounded-xl"
              isLoading={isLoading}
              leftIcon={<LogIn className="h-4 w-4" />}
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Enhanced Player Registration Callout */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-500">New athlete applying to the academy?</p>
          <Link
            href="/register"
            className="group flex items-center justify-between w-full rounded-xl border border-blue-200/90 bg-blue-50/70 p-3.5 text-xs font-bold text-brand-primary hover:bg-blue-100/80 hover:border-blue-300 transition-all duration-200 shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white text-brand-primary flex items-center justify-center shadow-2xs">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-brand-navy">New Player / Register</p>
                <p className="text-[11px] font-normal text-slate-500">
                  Submit your athlete profile for coach review
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-brand-primary group-hover:translate-x-0.5 transition-transform">
              Apply &rarr;
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-brand-surface p-4 sm:p-8 overflow-hidden transition-colors">
      {/* Ambient background decoration */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="flex justify-between items-center max-w-5xl mx-auto w-full z-10">
        <SportSyncLogo size="md" href="/" />
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle align="right" />
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#26344B] bg-white dark:bg-[#111C30] text-xs font-bold text-brand-primary dark:text-[#4B8BFF] shadow-2xs hover:bg-blue-50 dark:hover:bg-[#0B1120] transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Player Registration</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-6 z-10">
        <React.Suspense
          fallback={
            <div className="max-w-md w-full mx-auto my-8 p-8 text-center text-xs text-slate-400">
              Loading sign in...
            </div>
          }
        >
          <LoginForm />
        </React.Suspense>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-4 z-10">
        &copy; {new Date().getFullYear()} SportSync &bull; Dumka Sports Academy Management Desk
      </footer>
    </div>
  );
}
