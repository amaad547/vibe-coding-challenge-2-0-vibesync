"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, AlertCircle, Clock, ShieldX } from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
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
    <div className="min-h-screen flex flex-col justify-between bg-brand-surface p-4 sm:p-8">
      {/* Top Header */}
      <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
        <SportSyncLogo size="md" href="/" />
        <Link href="/register" className="text-xs font-semibold text-brand-primary hover:underline">
          New Player? Register
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
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

          <div className="mt-6 text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
            <p>Coach and Scout accounts are provisioned securely by the academy operator.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-4">
        &copy; {new Date().getFullYear()} SportSync &bull; Your Academy. Your Performance. Your
        Future.
      </footer>
    </div>
  );
}
