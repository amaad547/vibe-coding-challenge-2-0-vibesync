"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface CoachProfileData {
  id: string;
  email: string;
  role: string;
  name: string;
  phone: string;
  officePhone: string;
  academyAddress: string;
  morningHours: string;
  eveningHours: string;
  emergencyContact: string;
  bio: string;
  updatedAt?: string;
}

export default function CoachProfilePage() {
  const [profile, setProfile] = React.useState<CoachProfileData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form states
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [officePhone, setOfficePhone] = React.useState("");
  const [academyAddress, setAcademyAddress] = React.useState("");
  const [morningHours, setMorningHours] = React.useState("");
  const [eveningHours, setEveningHours] = React.useState("");
  const [emergencyContact, setEmergencyContact] = React.useState("");
  const [bio, setBio] = React.useState("");

  const fetchProfile = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/coach/profile");
      if (!res.ok) {
        throw new Error("Failed to load coach profile");
      }
      const json = await res.json();
      const data: CoachProfileData = json.data;
      setProfile(data);
      setName(data.name || "");
      setPhone(data.phone || "");
      setOfficePhone(data.officePhone || "");
      setAcademyAddress(data.academyAddress || "");
      setMorningHours(data.morningHours || "");
      setEveningHours(data.eveningHours || "");
      setEmergencyContact(data.emergencyContact || "");
      setBio(data.bio || "");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to load profile";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        name,
        phone,
        officePhone,
        academyAddress,
        morningHours,
        eveningHours,
        emergencyContact,
        bio,
      };

      const res = await fetch("/api/coach/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update profile");
      }

      setProfile(json.data);
      setSuccessMessage("Profile & landing page contact details updated successfully!");
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving profile";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell title="Coach Profile & Academy Contact" role="COACH">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand-navy via-slate-900 to-blue-950 p-6 text-white shadow-md">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-brand-primary text-white text-2xl font-black flex items-center justify-center shadow-lg ring-4 ring-white/10">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {name || "Dumka Head Coach"}
                </h2>
                <Badge variant="primary" dot>
                  <Shield className="w-3 h-3 mr-1 inline-block" />
                  Head Coach
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {profile?.email || "coach@dumkasports.org"} &bull; Dumka Sports Academy Desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProfile}
              disabled={isLoading}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Informational Alert */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Live Public Synchronization:</span> Contact details updated
            on this profile page (Phone numbers, Academy Address, Practice Hours, and Emergency notes)
            are dynamically reflected on the public <strong>Landing Page Contact Section</strong> so
            athletes, parents, and visiting scouts always have current information.
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 flex items-center gap-2.5 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs font-semibold text-rose-900 flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Editable Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal & Coach Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4 text-brand-primary" />
                    <span>Coach Identity & Bio</span>
                  </CardTitle>
                  <CardDescription>
                    Official coaching designation and academy representation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar / Dumka Head Coach"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-brand-navy placeholder:text-slate-400 focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Account Email (Login Identifier)
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          disabled
                          value={profile?.email || ""}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
                        />
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Bound to your authenticated coach login account.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Coach Biography / Credentials
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief description of coaching qualifications, sports handled, and certifications..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-brand-navy placeholder:text-slate-400 focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Public Academy Contact Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Contact Details</span>
                  </CardTitle>
                  {/* <CardDescription>
                    These fields are published on the Landing Page Contact Section for students,
                    parents, and visiting scouts.
                  </CardDescription> */}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Phone Numbers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Direct Helpline / Mobile <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 94311 00000"
                          className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-brand-navy placeholder:text-slate-400 focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                        />
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Office / Landline Phone
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={officePhone}
                          onChange={(e) => setOfficePhone(e.target.value)}
                          placeholder="+91 (06434) 220000"
                          className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-brand-navy placeholder:text-slate-400 focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                        />
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>
                  </div>

                  {/* Academy Ground Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Academy Ground & Complex Address <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={academyAddress}
                      onChange={(e) => setAcademyAddress(e.target.value)}
                      placeholder="Dumka Sports Complex, Near Indoor Stadium, SP College Road, Dumka, Jharkhand - 814101"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-brand-navy placeholder:text-slate-400 focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>

                  {/* Practice Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Morning Practice Hours <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={morningHours}
                          onChange={(e) => setMorningHours(e.target.value)}
                          placeholder="5:30 AM – 9:00 AM"
                          className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-brand-navy placeholder:text-slate-400 focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                        />
                        <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Evening Practice Hours <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={eveningHours}
                          onChange={(e) => setEveningHours(e.target.value)}
                          placeholder="3:30 PM – 7:00 PM"
                          className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-brand-navy placeholder:text-slate-400 focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                        />
                        <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>
                  </div>

                  {/* Emergency / On-Field Staff */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Emergency / On-Field Staff Notice
                    </label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="e.g. On-field Medical & Staff"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-brand-navy placeholder:text-slate-400 focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button Bar */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                  href="/coach"
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-brand-navy"
                >
                  Cancel
                </Link>
                <Button
                  type="submit"
                  disabled={isSaving || isLoading}
                  className="bg-brand-primary hover:bg-brand-primaryHover text-white text-xs font-bold px-6 py-2.5 shadow-md shadow-blue-500/20"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 mr-2" />
                      Save & Update Landing Page
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Right Column: Live Landing Page Preview */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    About Live Preview
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Auto Sync
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Address Preview */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-brand-primary font-bold text-[11px] mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Academy Ground</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {academyAddress || "Dumka Sports Complex, Near Indoor Stadium, SP College Road, Dumka, Jharkhand - 814101"}
                    </p>
                  </div>

                  {/* Helpline Preview */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px] mb-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Direct Helpline</span>
                    </div>
                    <p className="text-slate-700">
                      Helpline: <strong className="text-brand-navy">{phone || "+91 94311 00000"}</strong>
                    </p>
                    {officePhone && (
                      <p className="text-slate-700 mt-0.5">
                        Office: <strong className="text-brand-navy">{officePhone}</strong>
                      </p>
                    )}
                  </div>

                  {/* Email Inquiries Preview */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-[11px] mb-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Inquiries</span>
                    </div>
                    <p className="text-slate-700">
                      Coach: <strong className="text-brand-navy">{profile?.email || "coach@dumkasports.org"}</strong>
                    </p>
                    <p className="text-slate-500 text-[10px] mt-0.5">
                      Head Coach: {name || "Dumka Head Coach"}
                    </p>
                  </div>

                  {/* Practice Hours Preview */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-amber-600 font-bold text-[11px] mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Practice Hours</span>
                    </div>
                    <p className="text-slate-700">
                      Morning: <strong>{morningHours || "5:30 AM – 9:00 AM"}</strong>
                    </p>
                    <p className="text-slate-700">
                      Evening: <strong>{eveningHours || "3:30 PM – 7:00 PM"}</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                  {/* <Link
                    href="/"
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-primary hover:underline"
                  >
                    <span>Check live landing page</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link> */}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

