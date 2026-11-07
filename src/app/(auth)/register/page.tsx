"use client";

import * as React from "react";
import Link from "next/link";
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  LogIn,
  User,
  Mail,
  Lock,
  Calendar,
  Sparkles,
} from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getSkillsForSport, formatSkillLabel } from "@/lib/constants/skills";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const SPORTS = [
  { id: "football", label: "Football", emoji: "⚽" },
  { id: "cricket", label: "Cricket", emoji: "🏏" },
  { id: "athletics", label: "Athletics", emoji: "🏃" },
  { id: "badminton", label: "Badminton", emoji: "🏸" },
];

export default function RegisterPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [age, setAge] = React.useState("");
  const [sport, setSport] = React.useState("football");
  const [skill, setSkill] = React.useState("forward");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const availableSkills = React.useMemo(() => getSkillsForSport(sport), [sport]);

  const handleSportChange = (newSport: string) => {
    setSport(newSport);
    const skills = getSkillsForSport(newSport);
    if (skills && skills.length > 0 && skills[0]) {
      setSkill(skills[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 5 || parsedAge > 100) {
      setErrorMessage("Please enter a valid age between 5 and 100.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          age: parsedAge,
          sport,
          skill,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error?.message || "Registration failed. Please check your inputs.");
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
    } catch {
      setErrorMessage("Network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-brand-surface p-4 sm:p-8 overflow-hidden transition-colors">
      {/* Ambient background decoration */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-400/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="flex justify-between items-center max-w-5xl mx-auto w-full z-10">
        <SportSyncLogo size="md" href="/" />
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle align="right" />
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-[#26344B] bg-white dark:bg-[#111C30] text-xs font-bold text-brand-navy dark:text-[#F8FAFC] shadow-2xs hover:bg-slate-50 dark:hover:bg-[#0B1120] hover:border-slate-400 transition-all hover:scale-[1.02]"
          >
            <LogIn className="w-3.5 h-3.5 text-brand-primary dark:text-[#4B8BFF]" />
            <span>Already registered? Sign In</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-6 z-10">
        <div className="relative max-w-md w-full mx-auto my-4">
          {/* Ambient Glow behind the Registration Card */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-blue-500/20 to-indigo-500/10 blur-xl opacity-75 pointer-events-none" />

          <div className="relative rounded-2xl border border-slate-200/90 dark:border-[#26344B] bg-white/95 dark:bg-[#111C30]/95 p-8 shadow-xl backdrop-blur-sm">
            {isSubmitted ? (
              <div className="text-center py-2 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-brand-navy">Registration Submitted</h2>
                  <p className="mt-2 text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                    Your athlete account is registered with{" "}
                    <span className="font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
                      PENDING VERIFICATION
                    </span>{" "}
                    status.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#26344B] text-left text-xs text-slate-700 dark:text-[#F8FAFC] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#94A3B8]">Athlete Name:</span>
                    <span className="font-bold text-brand-navy">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#94A3B8]">Email:</span>
                    <span className="font-mono">{email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#94A3B8]">Discipline:</span>
                    <span className="font-bold capitalize">{sport}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#94A3B8]">Primary Skill:</span>
                    <span className="font-bold text-brand-primary dark:text-[#4B8BFF]">{formatSkillLabel(skill)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#94A3B8]">Review Status:</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">Awaiting Head Coach Approval</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                  The head coach will review your enrollment and skill profile shortly. Once
                  verified, you can sign in to access your performance ledger.
                </p>

                <div className="pt-2">
                  <Link href="/login" className="block">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full font-bold rounded-xl gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Proceed to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-blue-950/50 text-brand-primary dark:text-[#4B8BFF] mb-3 shadow-inner">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-brand-navy">
                    Athlete Registration
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                    Dumka Sports Academy &bull; Performance Desk
                  </p>
                </div>

                {errorMessage && (
                  <div className="mb-6 rounded-xl p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94A3B8]">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-[#94A3B8]">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aarav Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-[#26344B] bg-white/90 dark:bg-[#0B1120]/90 pl-10 pr-3 py-2 text-sm text-brand-navy dark:text-[#F8FAFC] shadow-2xs transition-all placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]/60 focus:border-brand-primary dark:focus:border-[#4B8BFF] focus:bg-white dark:focus:bg-[#0B1120] focus:outline-hidden focus:ring-3 focus:ring-brand-primary/20"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94A3B8]">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-[#94A3B8]">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="athlete@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-[#26344B] bg-white/90 dark:bg-[#0B1120]/90 pl-10 pr-3 py-2 text-sm text-brand-navy dark:text-[#F8FAFC] shadow-2xs transition-all placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]/60 focus:border-brand-primary dark:focus:border-[#4B8BFF] focus:bg-white dark:focus:bg-[#0B1120] focus:outline-hidden focus:ring-3 focus:ring-brand-primary/20"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94A3B8]">
                      Password (min 6 characters)
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-[#94A3B8]">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-[#26344B] bg-white/90 dark:bg-[#0B1120]/90 pl-10 pr-3 py-2 text-sm text-brand-navy dark:text-[#F8FAFC] shadow-2xs transition-all placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]/60 focus:border-brand-primary dark:focus:border-[#4B8BFF] focus:bg-white dark:focus:bg-[#0B1120] focus:outline-hidden focus:ring-3 focus:ring-brand-primary/20"
                      />
                    </div>
                  </div>

                  {/* Age & Primary Sport Selector */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 text-left col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94A3B8]">
                        Age
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-[#94A3B8]">
                          <Calendar className="h-3.5 w-3.5" />
                        </div>
                        <input
                          type="number"
                          min="5"
                          max="100"
                          required
                          placeholder="17"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          disabled={isLoading}
                          className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-[#26344B] bg-white/90 dark:bg-[#0B1120]/90 pl-9 pr-2 py-2 text-sm text-brand-navy dark:text-[#F8FAFC] shadow-2xs transition-all placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]/60 focus:border-brand-primary dark:focus:border-[#4B8BFF] focus:bg-white dark:focus:bg-[#0B1120] focus:outline-hidden focus:ring-3 focus:ring-brand-primary/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-left col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94A3B8]">
                        Primary Sport
                      </label>
                      <select
                        value={sport}
                        onChange={(e) => handleSportChange(e.target.value)}
                        disabled={isLoading}
                        className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-[#26344B] bg-white/90 dark:bg-[#0B1120]/90 px-3 py-2 text-sm text-brand-navy dark:text-[#F8FAFC] shadow-2xs transition-all focus:border-brand-primary dark:focus:border-[#4B8BFF] focus:bg-white dark:focus:bg-[#0B1120] focus:outline-hidden focus:ring-3 focus:ring-brand-primary/20 font-medium"
                      >
                        <option value="football">⚽ Football</option>
                        <option value="cricket">🏏 Cricket</option>
                        <option value="athletics">🏃 Athletics</option>
                        <option value="badminton">🏸 Badminton</option>
                      </select>
                    </div>
                  </div>

                  {/* Sport Quick Selector Chips */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {SPORTS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSportChange(s.id)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          sport === s.id
                            ? "bg-blue-50 dark:bg-blue-950/60 border-brand-primary dark:border-[#4B8BFF] text-brand-primary dark:text-[#4B8BFF] shadow-2xs"
                            : "bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-[#26344B] text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#111C30]"
                        }`}
                      >
                        <span>{s.emoji}</span>
                        <span className="truncate">{s.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Skill / Role Selector */}
                  <div className="space-y-1.5 text-left pt-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94A3B8] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-primary dark:text-[#4B8BFF]" />
                      <span>Specialization / Skill</span>
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      {availableSkills.map((sk) => (
                        <button
                          key={sk.id}
                          type="button"
                          onClick={() => setSkill(sk.id)}
                          className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                            skill === sk.id
                              ? "bg-brand-primary dark:bg-[#4B8BFF] text-white border-brand-primary dark:border-[#4B8BFF] shadow-xs"
                              : "bg-slate-50/80 dark:bg-[#0B1120]/80 border-slate-200 dark:border-[#26344B] text-slate-700 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#111C30]"
                          }`}
                        >
                          <span className="truncate">{sk.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full font-bold shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all rounded-xl"
                      isLoading={isLoading}
                      leftIcon={<UserPlus className="h-4 w-4" />}
                    >
                      Submit Registration
                    </Button>
                  </div>
                </form>

                {/* Enhanced Already Registered Callout */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-[#26344B] text-center space-y-3">
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8]">Already registered with the academy?</p>
                  <Link
                    href="/login"
                    className="group flex items-center justify-between w-full rounded-xl border border-slate-200 dark:border-[#26344B] bg-slate-50/80 dark:bg-[#0B1120]/80 p-3.5 text-xs font-bold text-brand-navy hover:bg-white dark:hover:bg-[#111C30] hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-brand-primary dark:text-[#4B8BFF] flex items-center justify-center shadow-2xs">
                        <LogIn className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-brand-navy">Already registered? Sign In</p>
                        <p className="text-[11px] font-normal text-slate-500 dark:text-[#94A3B8]">
                          Log in to your athlete or staff dashboard
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-brand-primary dark:text-[#4B8BFF] group-hover:translate-x-0.5 transition-transform">
                      Sign In &rarr;
                    </span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 dark:text-slate-500 py-4 z-10">
        &copy; {new Date().getFullYear()} SportSync &bull; Dumka Sports Academy Management Desk
      </footer>
    </div>
  );
}
