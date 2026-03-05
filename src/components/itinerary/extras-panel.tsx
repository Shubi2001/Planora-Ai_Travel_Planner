"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Calendar, Rocket, Clock, Plus, X, ExternalLink, CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { differenceInDays, format, parseISO } from "date-fns";
import type { Trip } from "@prisma/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useSocialPreferences } from "@/hooks/use-social-preferences";

interface InsurancePolicy {
  id: string;
  provider: string;
  policyNo: string;
  coverage: string;
  contactNo: string;
  expiryDate: string;
  notes: string;
}

function getInsurance(tripId: string): InsurancePolicy[] {
  try { return JSON.parse(localStorage.getItem(`insurance_${tripId}`) ?? "[]"); } catch { return []; }
}
function saveInsurance(tripId: string, p: InsurancePolicy[]) {
  try { localStorage.setItem(`insurance_${tripId}`, JSON.stringify(p)); } catch { /* ignore */ }
}

function getPackingList(tripId: string): { id: string; item: string; packed: boolean }[] {
  try { return JSON.parse(localStorage.getItem(`packing_${tripId}`) ?? "[]"); } catch { return []; }
}
function savePackingList(tripId: string, list: { id: string; item: string; packed: boolean }[]) {
  try { localStorage.setItem(`packing_${tripId}`, JSON.stringify(list)); } catch { /* ignore */ }
}

const DEFAULT_PACKING = [
  "Passport + visa documents", "Travel insurance card", "Flight tickets", "Hotel confirmation",
  "Currency + cards", "Phone charger + adapters", "Universal power bank", "Medication",
  "Sunscreen", "First aid kit", "Camera", "Comfortable shoes", "Weather-appropriate clothing",
];

export default function ExtrasPanel({ trip }: { trip: Trip }) {
  const { facebookShareEnabled } = useSocialPreferences();
  const [insurance, setInsurance] = useState<InsurancePolicy[]>([]);
  const [addingInsurance, setAddingInsurance] = useState(false);
  const [insuranceForm, setInsuranceForm] = useState({ provider: "", policyNo: "", coverage: "", contactNo: "", expiryDate: "", notes: "" });

  const [packingList, setPackingList] = useState<{ id: string; item: string; packed: boolean }[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    setInsurance(getInsurance(trip.id));
    const existing = getPackingList(trip.id);
    if (existing.length === 0) {
      const defaults = DEFAULT_PACKING.map((item) => ({ id: `d_${item}`, item, packed: false }));
      setPackingList(defaults);
      savePackingList(trip.id, defaults);
    } else {
      setPackingList(existing);
    }
  }, [trip.id]);

  const savePolicy = () => {
    if (!insuranceForm.provider.trim() || !insuranceForm.policyNo.trim()) {
      toast.error("Provider and policy number are required");
      return;
    }
    const policy: InsurancePolicy = { id: Date.now().toString(), ...insuranceForm };
    const updated = [...insurance, policy];
    setInsurance(updated);
    saveInsurance(trip.id, updated);
    setAddingInsurance(false);
    setInsuranceForm({ provider: "", policyNo: "", coverage: "", contactNo: "", expiryDate: "", notes: "" });
    toast.success("Insurance policy saved!");
  };

  const togglePacked = (id: string) => {
    const updated = packingList.map((i) => i.id === id ? { ...i, packed: !i.packed } : i);
    setPackingList(updated);
    savePackingList(trip.id, updated);
  };

  const addPackingItem = () => {
    if (!newItem.trim()) return;
    const updated = [...packingList, { id: Date.now().toString(), item: newItem.trim(), packed: false }];
    setPackingList(updated);
    savePackingList(trip.id, updated);
    setNewItem("");
  };

  const removePackingItem = (id: string) => {
    const updated = packingList.filter((i) => i.id !== id);
    setPackingList(updated);
    savePackingList(trip.id, updated);
  };

  // Countdown
  const daysUntil = trip.startDate ? differenceInDays(new Date(trip.startDate), new Date()) : null;
  const tripDuration = trip.startDate && trip.endDate
    ? differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) : null;

  // Calendar sync links
  const encodeCalEvent = (title: string, start?: Date | null, end?: Date | null) => {
    if (!start || !end) return null;
    const fmt = (d: Date) => format(d, "yyyyMMdd");
    const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&details=Travel%20itinerary%20via%20AI%20Travel%20Planner`;
    return { google };
  };

  const calLinks = encodeCalEvent(trip.title, trip.startDate ? new Date(trip.startDate) : null, trip.endDate ? new Date(trip.endDate) : null);
  const packedCount = packingList.filter((i) => i.packed).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="countdown" className="flex flex-col h-full">
        <div className="px-4 pt-3 border-b">
          <TabsList className="h-8 text-xs w-full grid grid-cols-4">
            <TabsTrigger value="countdown" className="text-xs gap-1"><Clock className="h-3 w-3" />Countdown</TabsTrigger>
            <TabsTrigger value="packing" className="text-xs gap-1"><Package className="h-3 w-3" />Pack</TabsTrigger>
            <TabsTrigger value="insurance" className="text-xs gap-1"><Shield className="h-3 w-3" />Insurance</TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs gap-1"><Calendar className="h-3 w-3" />Sync</TabsTrigger>
          </TabsList>
        </div>

        {/* COUNTDOWN */}
        <TabsContent value="countdown" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
          {daysUntil !== null && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "rounded-2xl p-6 text-center border",
                daysUntil < 0 ? "border-muted bg-muted/20" :
                daysUntil <= 7 ? "border-green-500/30 bg-green-500/5" :
                "border-violet-500/30 bg-violet-500/5"
              )}
            >
              {daysUntil < 0 ? (
                <>
                  <p className="text-4xl font-bold text-muted-foreground">{Math.abs(daysUntil)}</p>
                  <p className="text-muted-foreground mt-1 text-sm">days since your trip ended</p>
                  <p className="text-2xl mt-2">✈️ Hope it was amazing!</p>
                </>
              ) : daysUntil === 0 ? (
                <>
                  <p className="text-5xl font-bold text-green-400">TODAY!</p>
                  <p className="text-green-300 mt-2 text-lg">🎉 Your adventure begins!</p>
                </>
              ) : (
                <>
                  <p className={cn("text-6xl font-bold",
                    daysUntil <= 7 ? "text-green-400" : "text-violet-400"
                  )}>{daysUntil}</p>
                  <p className="text-muted-foreground mt-1">days until departure</p>
                  {daysUntil <= 7 && <p className="text-green-300 mt-2 text-sm animate-pulse">✈️ Almost time!</p>}
                  {daysUntil <= 30 && daysUntil > 7 && <p className="text-muted-foreground mt-2 text-xs">Check in opens {daysUntil - 2} days from now</p>}
                </>
              )}
            </motion.div>
          )}

          {/* Trip stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Destination", value: trip.destination, icon: "📍" },
              { label: "Duration", value: tripDuration !== null ? `${tripDuration} nights` : "—", icon: "🌙" },
              { label: "Group Size", value: `${trip.groupSize} traveler${trip.groupSize !== 1 ? "s" : ""}`, icon: "👥" },
              { label: "Travel Style", value: trip.travelStyle ?? "General", icon: "🎒" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border bg-card p-3">
                <p className="text-lg">{stat.icon}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">{stat.label}</p>
                <p className="font-medium text-sm truncate">{stat.value}</p>
              </div>
            ))}
          </div>

          {trip.startDate && trip.endDate && (
            <div className="rounded-xl border bg-card p-3 space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Dates</p>
              <p className="text-sm font-medium">
                {format(new Date(trip.startDate), "MMMM d, yyyy")} →{" "}
                {format(new Date(trip.endDate), "MMMM d, yyyy")}
              </p>
            </div>
          )}
        </TabsContent>

        {/* PACKING LIST */}
        <TabsContent value="packing" className="flex-1 overflow-y-auto p-4 space-y-3 mt-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {packedCount}/{packingList.length} packed
            </p>
            <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${packingList.length > 0 ? (packedCount / packingList.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Input value={newItem} onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPackingItem()}
              placeholder="Add item…" className="text-sm h-8" />
            <Button size="sm" variant="outline" className="h-8 px-3" onClick={addPackingItem}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-1">
            {packingList.map((item) => (
              <div key={item.id} className="flex items-center gap-2 group rounded-lg px-2 py-1.5 hover:bg-muted/30 transition-colors">
                <button onClick={() => togglePacked(item.id)}
                  className={cn("h-4 w-4 rounded border transition-all shrink-0",
                    item.packed ? "bg-green-500 border-green-500 text-white" : "border-input"
                  )}>
                  {item.packed && <CheckCircle className="h-3.5 w-3.5" />}
                </button>
                <span className={cn("text-sm flex-1", item.packed && "line-through text-muted-foreground")}>
                  {item.item}
                </span>
                <button onClick={() => removePackingItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* INSURANCE */}
        <TabsContent value="insurance" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
          {!addingInsurance && (
            <Button size="sm" variant="outline" className="gap-1.5 text-xs w-full" onClick={() => setAddingInsurance(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Insurance Policy
            </Button>
          )}

          {addingInsurance && (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">New Policy</p>
                <button onClick={() => setAddingInsurance(false)}><X className="h-4 w-4" /></button>
              </div>
              {[
                { key: "provider", label: "Insurance Provider", placeholder: "e.g. World Nomads" },
                { key: "policyNo", label: "Policy Number", placeholder: "e.g. WN-12345678" },
                { key: "coverage", label: "Coverage Type", placeholder: "e.g. Medical + Cancellation" },
                { key: "contactNo", label: "Emergency Contact", placeholder: "e.g. +1-800-123-4567" },
                { key: "expiryDate", label: "Policy Expiry", placeholder: "", type: "date" },
                { key: "notes", label: "Notes", placeholder: "Optional notes…" },
              ].map((field) => (
                <div key={field.key}>
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  <Input
                    type={field.type ?? "text"}
                    placeholder={field.placeholder}
                    value={insuranceForm[field.key as keyof typeof insuranceForm]}
                    onChange={(e) => setInsuranceForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
              ))}
              <Button size="sm" variant="gradient" className="w-full" onClick={savePolicy}>Save Policy</Button>
            </div>
          )}

          {insurance.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 text-muted-foreground gap-2">
              <Shield className="h-8 w-8 opacity-30" />
              <p className="text-sm">No insurance added yet</p>
            </div>
          ) : (
            insurance.map((p) => (
              <div key={p.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{p.provider}</p>
                  <Badge variant="outline" className="text-[10px]">#{p.policyNo}</Badge>
                </div>
                {p.coverage && <p className="text-xs text-muted-foreground">Coverage: {p.coverage}</p>}
                {p.contactNo && (
                  <a href={`tel:${p.contactNo}`} className="text-xs text-green-400 flex items-center gap-1 hover:underline">
                    📞 {p.contactNo}
                  </a>
                )}
                {p.expiryDate && (
                  <p className="text-xs text-muted-foreground">Expires: {format(parseISO(p.expiryDate), "MMM d, yyyy")}</p>
                )}
              </div>
            ))
          )}
        </TabsContent>

        {/* CALENDAR SYNC */}
        <TabsContent value="calendar" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" /> Add to Calendar
            </p>
            <p className="text-xs text-muted-foreground">Sync your trip dates with your calendar</p>

            {calLinks ? (
              <div className="space-y-2">
                <a href={calLinks.google} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-input hover:border-violet-500/30 bg-muted/20 hover:bg-accent px-3 py-2.5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📅</span>
                    <div>
                      <p className="text-sm font-medium">Google Calendar</p>
                      <p className="text-[10px] text-muted-foreground">Opens in browser</p>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                </a>

                <button
                  onClick={() => {
                    if (!trip.startDate || !trip.endDate) return;
                    const fmt = (d: Date) => format(d, "yyyyMMdd");
                    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${trip.title}\nDTSTART:${fmt(new Date(trip.startDate))}\nDTEND:${fmt(new Date(trip.endDate))}\nLOCATION:${trip.destination}\nDESCRIPTION:Travel itinerary via Planora\nEND:VEVENT\nEND:VCALENDAR`;
                    const blob = new Blob([ics], { type: "text/calendar" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url;
                    a.download = `${trip.title.replace(/\s+/g, "-")}.ics`;
                    a.click(); URL.revokeObjectURL(url);
                  }}
                  className="flex items-center justify-between w-full rounded-lg border border-input hover:border-violet-500/30 bg-muted/20 hover:bg-accent px-3 py-2.5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🍎</span>
                    <div>
                      <p className="text-sm font-medium">Apple Calendar / Outlook</p>
                      <p className="text-[10px] text-muted-foreground">Downloads .ics file</p>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-amber-400">Add trip dates to enable calendar sync</p>
            )}
          </div>

          {/* Share trip link */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <Rocket className="h-4 w-4 text-violet-400" /> Share Trip
            </p>
            <p className="text-xs text-muted-foreground">Share your read-only itinerary with family & friends</p>
            <div className="flex gap-2">
              <Button
                size="sm" variant="outline" className="flex-1 gap-2 text-xs"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/trips/${trip.id}/share`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ isPublic: true }),
                    });
                    const json = await res.json();
                    const url = json.data?.shareUrl;
                    if (url) {
                      await navigator.clipboard.writeText(url);
                      toast.success("Share link copied!");
                    } else toast.error("Failed to create share link");
                  } catch { toast.error("Failed to copy"); }
                }}
              >
                📋 Copy Link
              </Button>
              {facebookShareEnabled && (
                <Button
                  size="sm" variant="outline" className="flex-1 gap-2 text-xs"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/trips/${trip.id}/share`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isPublic: true }),
                      });
                      const json = await res.json();
                      const url = json.data?.shareUrl;
                      if (url) {
                        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                        window.open(fbUrl, "_blank", "width=600,height=400");
                        toast.success("Opening Facebook...");
                      } else toast.error("Failed to create share link");
                    } catch { toast.error("Failed to share"); }
                  }}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Share on Facebook
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
