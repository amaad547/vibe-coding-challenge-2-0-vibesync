"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, AlertCircle, Clock, ShieldX, ShieldCheck, Users, Key } from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorStatus, setErrorStatus] = React.useState<{
    type: "ERROR" | "PENDING" | "REJECTED";
    message: string;
  } | null>(null);

  // Check URL parameters for role preset (e.g. ?role=coach or ?role=scout)
  React.useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "scout") {
      setEmail("scout@dumkasports.org");
      setPassword("ScoutSecurePass123!");
    } else if (roleParam === "coach") {
      setEmail("coach@dumkasports.org");
      setPassword("CoachSecurePass123!");
    }
  }, [searchParams]);

  const handleQuickFill = (role: "COACH" | "SCOUT") => {
    setErrorStatus(null);
    if (role === "COACH") {
      setEmail("coach@dumkasports.org");
      setPassword("CoachSecurePass123!");
    } else {
      setEmail("scout@dumkasports.org");
      setPassword("ScoutSecurePass123!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorStatus(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const code = data.error?.code;
        if (code === "ACCOUNT_PENDING") {
          setErrorStatus({
            type: "PENDING",
            message:
              "Your player account registration is awaiting coach verification. Please check back later.",
          });
        } else if (code === "ACCOUNT_REJECTED") {
          setErrorStatus({
            type: "REJECTED",
            message:
              "Your registration was not approved by the academy. Please contact the head coach.",
          });
        } else {
          setErrorStatus({
            type: "ERROR",
            message: data.error?.message || "Invalid credentials. Please try again.",
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
        message: "Network or server connection failed. Please retry.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-6 space-y-4">
      {/* Quick Role Fill Pills */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-brand-primary" /> Quick Demo Fill
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill("COACH")}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 py-2 text-xs font-bold text-brand-primary hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            Coach Sign In
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("SCOUT")}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Scout Sign In
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black tracking-tight text-brand-navy">
            Sign In to SportSync
          </h1>
          <p className="text-xs text-slate-500 mt-1">Dumka Sports Academy Management Desk</p>
        </div>

        {errorStatus && (
          <div
            className={`mb-6 rounded-lg p-4 flex items-start gap-3 text-xs leading-relaxed ${
              errorStatus.type === "PENDING"
                ? "bg-amber-50 border border-amber-200 text-amber-800"
                : errorStatus.type === "REJECTED"
                  ? "bg-rose-50 border border-rose-200 text-rose-800"
                  : "bg-red-50 border border-red-200 text-red-800"
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
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="coach@dumkasports.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />

          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full font-bold"
              isLoading={isLoading}
              leftIcon={<LogIn className="h-4 w-4" />}
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Credentials Reference Helper */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
          <p className="font-bold text-slate-600">Default Academy Accounts:</p>
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>
              <span className="font-semibold text-brand-navy block">Coach:</span>
              <span className="text-slate-600">coach@dumkasports.org</span>
              <span className="text-slate-400 block font-mono">CoachSecurePass123!</span>
            </div>
            <div>
              <span className="font-semibold text-emerald-700 block">Scout:</span>
              <span className="text-slate-600">scout@dumkasports.org</span>
              <span className="text-slate-400 block font-mono">ScoutSecurePass123!</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center">
            Athletes sign in with their registered email and password.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-surface p-4 sm:p-8">
      {/* Top Header */}
      <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
        <SportSyncLogo size="md" href="/" />
        <Link href="/register" className="text-xs font-semibold text-brand-primary hover:underline">
          New Player? Register
        </Link>
      </div>

      <React.Suspense
        fallback={
          <div className="max-w-md w-full mx-auto my-8 p-8 text-center text-xs text-slate-400">
            Loading sign in...
          </div>
        }
      >
        <LoginForm />
      </React.Suspense>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-4">
        &copy; {new Date().getFullYear()} SportSync &bull; Your Academy. Your Performance. Your
        Future.
      </footer>
    </div>
  );
}
