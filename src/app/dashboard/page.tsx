"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Users,
  CalendarCheck,
  Trophy,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
} from "lucide-react";

export default function DashboardDemoPage() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [buttonLoading, setButtonLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSimulateAction = () => {
    setButtonLoading(true);
    setTimeout(() => {
      setButtonLoading(false);
      setModalOpen(false);
    }, 800);
  };

  const samplePlayers = [
    {
      id: "1",
      name: "Aarav Sharma",
      age: 17,
      sport: "Football",
      attendance: "85.7%",
      matches: 4,
      status: "Ready",
    },
    {
      id: "2",
      name: "Rohit Verma",
      age: 16,
      sport: "Football",
      attendance: "75.0%",
      matches: 2,
      status: "Ready",
    },
    {
      id: "3",
      name: "Sameer Soren",
      age: 18,
      sport: "Football",
      attendance: "62.5%",
      matches: 1,
      status: "Not Ready",
    },
    {
      id: "4",
      name: "Karan Murmu",
      age: 15,
      sport: "Cricket",
      attendance: "90.0%",
      matches: 3,
      status: "Ready",
    },
  ];

  return (
    <AppShell title="Academy Desk Overview" role="COACH">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-blue-100 bg-linear-to-r from-blue-50 to-white p-6 shadow-xs">
          <div>
            <h2 className="text-xl font-extrabold text-brand-navy">Dumka Sports Academy Desk</h2>
            <p className="text-xs text-slate-600 mt-1">
              Phase 1 foundation active. Official branding, responsive shell, and reusable UI
              primitives ready.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setModalOpen(true)}
            >
              Open Quick Action Modal
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Players
                </p>
                <h3 className="text-2xl font-black text-brand-navy mt-1">24</h3>
                <span className="text-[11px] text-emerald-600 font-medium">100% registered</span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-brand-primary flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Practice Sessions
                </p>
                <h3 className="text-2xl font-black text-brand-navy mt-1">18</h3>
                <span className="text-[11px] text-slate-500 font-medium">Closed & locked</span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CalendarCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Finalized Matches
                </p>
                <h3 className="text-2xl font-black text-brand-navy mt-1">6</h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  Present-only verified
                </span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Trophy className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Trial Ready
                </p>
                <h3 className="text-2xl font-black text-brand-navy mt-1">11</h3>
                <span className="text-[11px] text-brand-primary font-medium">
                  &ge;75% att &bull; &ge;2 matches
                </span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive UI Showcase & Table */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Registered Academy Talent</CardTitle>
              <CardDescription>
                Preview of data table primitive with status badges and search input.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Filter players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
              <Button variant="outline" size="md" leftIcon={<Filter className="h-4 w-4" />}>
                Filter
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Primary Sport</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Matches</TableHead>
                  <TableHead>Readiness</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {samplePlayers
                  .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-semibold text-brand-navy">{player.name}</TableCell>
                      <TableCell>{player.age}</TableCell>
                      <TableCell>
                        <Badge variant="neutral">{player.sport}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{player.attendance}</TableCell>
                      <TableCell>{player.matches}</TableCell>
                      <TableCell>
                        <Badge variant={player.status === "Ready" ? "success" : "warning"} dot>
                          {player.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Buttons and State Demos */}
        <Card>
          <CardHeader>
            <CardTitle>Design System Primitives</CardTitle>
            <CardDescription>
              Buttons, states, loading indicators, and color tokens adhering to the SportSync
              guidelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Electric Blue</Button>
              <Button variant="secondary">Dark Navy Secondary</Button>
              <Button variant="outline">Clean Outline</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Action</Button>
              <Button variant="primary" isLoading>
                Loading State
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <Badge variant="primary" dot>
                Electric Blue
              </Badge>
              <Badge variant="success" dot>
                Ready Status
              </Badge>
              <Badge variant="warning" dot>
                Not Ready
              </Badge>
              <Badge variant="danger" dot>
                Absent / Locked
              </Badge>
              <Badge variant="info" dot>
                Session Open
              </Badge>
              <Badge variant="neutral">Neutral Tag</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accessible Reusable Modal Component */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Reusable Modal Primitive"
        description="This modal demonstrates the accessible dialog component with backdrop blur and escape key handling."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={buttonLoading}
              onClick={handleSimulateAction}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Confirm Action
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Sample Input Field" placeholder="e.g. Football Practice Session" />
          <p className="text-xs text-slate-500">
            Modal dialogues support keyboard focus management, custom footer actions, and flexible
            content layouts.
          </p>
        </div>
      </Modal>
    </AppShell>
  );
}
