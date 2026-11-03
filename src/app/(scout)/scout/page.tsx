"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Search, Filter, LogOut, Award, AlertCircle } from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TableEmpty } from "@/components/ui/table";

export default function ScoutRegistryPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-surface">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 sm:px-8 py-3 backdrop-blur-sm flex justify-between items-center">
        <SportSyncLogo size="sm" href="/" />
        <div className="flex items-center gap-3">
          <Badge variant="success" dot>
            Scout Verified
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
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-6">
        {/* Scout Header Banner */}
        <div className="rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50 to-white p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-brand-navy">Scout Talent Registry</h1>
              <p className="text-xs text-slate-500">
                Dumka Sports Academy &bull; Verified Trial-Ready Talent Pool
              </p>
            </div>
          </div>
        </div>

        {/* Security / Invariant Notice */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Privacy-Preserving Scout Registry</p>
            <p>
              By system policy, scouts can discover and view profiles of <strong>Ready</strong>{" "}
              players only (attendance &ge; 75% and &ge; 2 finalized matches). The general academy
              directory and not-ready players are never exposed.
            </p>
          </div>
        </div>

        {/* Talent Filter & Table */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Ready Talent Pool
              </CardTitle>
              <CardDescription>
                Players meeting the trial readiness criteria for Dumka Sports Academy.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Filter Ready players..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
              <Button variant="outline" size="md" leftIcon={<Filter className="h-4 w-4" />}>
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TableEmpty
              message="No players currently meet the Ready criteria."
              description="Players must achieve at least 75% practice attendance and participate in at least 2 finalized matches to appear in the Scout Registry."
            />
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-6 border-t border-slate-200 bg-white">
        SportSync &bull; Your Academy. Your Performance. Your Future.
      </footer>
    </div>
  );
}
