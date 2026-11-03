"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, Shield, Activity, CalendarCheck, Trophy, LogOut } from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingOverlay } from "@/components/ui/loading";

interface ProfileData {
  user: {
    id: string;
    email: string;
    role: string;
    accountStatus: string;
  };
  player: {
    id: string;
    name: string;
    age: number;
    sport: string;
    isActive: boolean;
    registrationStatus: string;
  } | null;
}

export default function PlayerPortalPage() {
  const router = useRouter();
  const [data, setData] = React.useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const json = await res.json();
        setData(json.data);
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-surface">
        <LoadingOverlay message="Loading player profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-surface">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 sm:px-8 py-3 backdrop-blur-sm flex justify-between items-center">
        <SportSyncLogo size="sm" href="/" />
        <div className="flex items-center gap-3">
          <Badge variant="info" dot>
            Player Portal
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="h-3.5 w-3.5" />}
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-6">
        {/* Welcome Card */}
        <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 to-white p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold text-lg">
              {data?.player?.name?.charAt(0) || "P"}
            </div>
            <div>
              <h1 className="text-2xl font-black text-brand-navy">
                {data?.player?.name || "Player Profile"}
              </h1>
              <p className="text-xs text-slate-500">
                Dumka Sports Academy &bull; Registered Sport:{" "}
                <span className="font-semibold text-brand-primary uppercase">
                  {data?.player?.sport || "N/A"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-brand-primary" />
                Player Record Details
              </CardTitle>
              <CardDescription>
                Your personal details registered with the academy desk.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Player ID:</span>
                <span className="font-mono text-slate-800">{data?.player?.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-800">{data?.user.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Age:</span>
                <span className="font-semibold text-slate-800">{data?.player?.age} years</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Account Status:</span>
                <Badge variant="success" dot>
                  {data?.player?.registrationStatus}
                </Badge>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Academy:</span>
                <span className="font-semibold text-slate-800">Dumka Sports Academy</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                Privacy & Self-Service
              </CardTitle>
              <CardDescription>
                Strict role-based isolation guaranteed by SportSync.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                As an authorized player, your access is strictly scoped to your own profile,
                attendance records, and match participation.
              </p>
              <p>Attempts to supply or request other player IDs are blocked at the server level.</p>
              <div className="pt-2 flex items-center gap-2 text-emerald-700 font-semibold">
                <Activity className="w-4 h-4" /> Ready Rule: &ge;75% Attendance & &ge;2 Matches
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Teasers for Subsequent Phases */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-navy">Attendance Record</h4>
              <p className="text-xs text-slate-500">
                Tracks practice sessions for your sport since your registration date.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-navy">Match History & Scores</h4>
              <p className="text-xs text-slate-500">
                Verified matches and individual scores validated against closed sessions.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-6 border-t border-slate-200 bg-white">
        SportSync &bull; Your Academy. Your Performance. Your Future.
      </footer>
    </div>
  );
}
