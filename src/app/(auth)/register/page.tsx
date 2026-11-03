"use client";

import * as React from "react";
import Link from "next/link";
import { UserPlus, CheckCircle2, AlertCircle } from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [age, setAge] = React.useState("");
  const [sport, setSport] = React.useState("football");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          age: parseInt(age, 10),
          sport,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error?.message || "Registration failed. Please check your details.");
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
      setIsLoading(false);
    } catch {
      setErrorMessage("Network connection failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-surface p-4 sm:p-8">
      {/* Top Header */}
      <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
        <SportSyncLogo size="md" href="/" />
        <Link href="/login" className="text-xs font-semibold text-brand-primary hover:underline">
          Already registered? Sign In
        </Link>
      </div>

      {/* Main Registration Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          {isSubmitted ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-brand-navy">Registration Submitted</h2>
              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                Your player account has been recorded with{" "}
                <strong className="text-amber-600">PENDING</strong> verification status.
              </p>
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1">
                <p>
                  <strong>Name:</strong> {name}
                </p>
                <p>
                  <strong>Email:</strong> {email}
                </p>
                <p>
                  <strong>Primary Sport:</strong> {sport.toUpperCase()}
                </p>
                <p>
                  <strong>Status:</strong> Awaiting Coach Review
                </p>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                You will be able to log in immediately once the head coach approves your
                registration.
              </p>
              <div className="mt-6">
                <Link href="/login">
                  <Button variant="primary" size="md" className="w-full">
                    Proceed to Sign In Page
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-black tracking-tight text-brand-navy">
                  Player Registration
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Register for Dumka Sports Academy desk
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 rounded-lg p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />

                <Input
                  label="Email Address"
                  type="email"
                  required
                  placeholder="player@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />

                <Input
                  label="Password (min 6 characters)"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Age (Years)"
                    type="number"
                    min="5"
                    max="100"
                    required
                    placeholder="17"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    disabled={isLoading}
                  />

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold tracking-wide text-brand-navy">
                      Primary Sport
                    </label>
                    <select
                      value={sport}
                      onChange={(e) => setSport(e.target.value)}
                      disabled={isLoading}
                      className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-brand-navy transition-colors focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    >
                      <option value="football">Football</option>
                      <option value="cricket">Cricket</option>
                      <option value="athletics">Athletics</option>
                      <option value="badminton">Badminton</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full font-bold"
                    isLoading={isLoading}
                    leftIcon={<UserPlus className="h-4 w-4" />}
                  >
                    Submit Registration
                  </Button>
                </div>
              </form>
            </>
          )}
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
