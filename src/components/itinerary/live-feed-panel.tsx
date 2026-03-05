"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Cloud, Music, Zap, Globe, RefreshCw, CheckCircle, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { format, differenceInDays } from "date-fns";

interface Alert {
  id: string;
  type: "weather" | "safety" | "event" | "transport" | "health";
  severity: "info" | "warning" | "danger";
  title: string;
  description: string;
  date?: string;
  source?: string;
}

// Generate context-aware alerts based on destination + dates
function generateAlerts(destination: string, startDate: Date, endDate: Date): Alert[] {
  const dest = destination.toLowerCase();
  const alerts: Alert[] = [];
  const daysUntil = differenceInDays(startDate, new Date());
  const month = startDate.getMonth() + 1; // 1-12

  // Weather alerts by region/season
  if (dest.includes("india") || dest.includes("mumbai") || dest.includes("goa") || dest.includes("kerala")) {
    if (month >= 6 && month <= 9) {
      alerts.push({ id: "w1", type: "weather", severity: "warning", title: "Monsoon Season Active",
        description: "Heavy rainfall expected. Carry waterproof gear. Some roads may be flooded. Check local advisories.", source: "Meteorological Dept" });
    }
    if (month >= 4 && month <= 6) {
      alerts.push({ id: "w2", type: "weather", severity: "warning", title: "Extreme Heat Advisory",
        description: "Temperatures may exceed 40°C. Stay hydrated, avoid outdoor activities 11am–4pm.", source: "IMD" });
    }
  }

  if (dest.includes("japan") || dest.includes("tokyo") || dest.includes("kyoto")) {
    if (month === 3 || month === 4) {
      alerts.push({ id: "e1", type: "event", severity: "info", title: "Cherry Blossom Season 🌸",
        description: "Peak sakura season! Expect crowded parks and transport. Book restaurants in advance.", source: "Japan Tourism" });
    }
    if (month >= 6 && month <= 9) {
      alerts.push({ id: "w3", type: "weather", severity: "warning", title: "Typhoon Season",
        description: "Japan typhoon season is active. Monitor JMA weather alerts. Some transport may be disrupted.", source: "JMA" });
    }
  }

  if (dest.includes("thailand") || dest.includes("bangkok") || dest.includes("phuket")) {
    if (month >= 5 && month <= 10) {
      alerts.push({ id: "w4", type: "weather", severity: "warning", title: "Rainy Season",
        description: "Afternoon thunderstorms common. Beach activities may be limited. Great for budget travelers.", source: "Thai Met Dept" });
    }
    alerts.push({ id: "h1", type: "health", severity: "info", title: "Dengue Fever Risk",
      description: "Use insect repellent especially at dawn/dusk. Seek medical attention for high fever.", source: "WHO" });
  }

  if (dest.includes("europe") || dest.includes("france") || dest.includes("italy") || dest.includes("spain")) {
    if (month >= 7 && month <= 8) {
      alerts.push({ id: "e2", type: "event", severity: "info", title: "Peak Tourist Season",
        description: "Major attractions will be very crowded. Book skip-the-line tickets in advance. High prices.", source: "Tourism Board" });
    }
    if (month >= 6 && month <= 9) {
      alerts.push({ id: "w5", type: "weather", severity: "info", title: "Heatwave Possible",
        description: "European summers increasingly hot. Some areas experience heatwaves above 38°C.", source: "Meteo" });
    }
  }

  if (dest.includes("dubai") || dest.includes("uae")) {
    if (month >= 6 && month <= 9) {
      alerts.push({ id: "w6", type: "weather", severity: "warning", title: "Extreme Summer Heat",
        description: "Temperatures 40-50°C. Outdoor activities not recommended midday. Mall/indoor events recommended.", source: "UAE Met Office" });
    }
  }

  // Universal alerts
  if (daysUntil < 30 && daysUntil > 0) {
    alerts.push({ id: "t1", type: "transport", severity: "info", title: "Travel Reminder",
      description: "Check airline policies for baggage. Online check-in usually opens 48-72 hours before departure.",
      date: format(startDate, "MMM d"), source: "System" });
  }

  alerts.push({ id: "s1", type: "safety", severity: "info", title: "Register Your Trip",
    description: "Register with your country's embassy online for safety alerts during your stay.", source: "Advisory" });

  // Generic festival hints
  const festivals: Record<string, { month: number; name: string; desc: string }[]> = {
    india: [
      { month: 10, name: "Diwali Season 🪔", desc: "Festival of Lights celebrations. Expect fireworks, crowds, and closures." },
      { month: 3, name: "Holi Season 🎨", desc: "Festival of Colors. Wear old clothes, protect valuables." },
    ],
    japan: [{ month: 8, name: "Obon Festival", desc: "Traditional Buddhist festival. Some businesses close. Beautiful lantern events." }],
    thailand: [{ month: 4, name: "Songkran (Thai New Year) 💦", desc: "Water festival — expect street water fights city-wide." }],
  };

  for (const [country, fests] of Object.entries(festivals)) {
    if (dest.includes(country)) {
      for (const fest of fests) {
        if (Math.abs(month - fest.month) <= 1) {
          alerts.push({ id: `f_${fest.name}`, type: "event", severity: "info", title: fest.name, description: fest.desc, source: "Culture" });
        }
      }
    }
  }

  return alerts;
}

const TYPE_ICONS = { weather: Cloud, safety: AlertTriangle, event: Music, transport: Zap, health: Globe };
const SEVERITY_STYLES = {
  info: "border-blue-500/30 bg-blue-500/5",
  warning: "border-amber-500/30 bg-amber-500/5",
  danger: "border-red-500/30 bg-red-500/5",
};
const SEVERITY_BADGE = {
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  danger: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function LiveFeedPanel({ destination, startDate, endDate }: { destination: string; startDate: Date; endDate: Date }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set<string>());

  const refresh = () => {
    setLoading(true);
    setTimeout(() => {
      setAlerts(generateAlerts(destination, startDate, endDate));
      setLastUpdated(new Date());
      setLoading(false);
    }, 900);
  };

  useEffect(() => { refresh(); }, [destination]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = alerts.filter((a) => !dismissed.has(a.id));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-400" /> Live Trip Feed
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {lastUpdated ? `Updated ${format(lastUpdated, "HH:mm")}` : "Loading…"}
          </p>
        </div>
        <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center h-24 gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 animate-spin" /> Checking alerts for {destination}…
          </div>
        )}

        <AnimatePresence>
          {!loading && visible.map((alert, i) => {
            const Icon = TYPE_ICONS[alert.type];
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className={cn("rounded-xl border p-3 space-y-1.5", SEVERITY_STYLES[alert.severity])}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4 shrink-0",
                      alert.severity === "danger" ? "text-red-400" :
                      alert.severity === "warning" ? "text-amber-400" : "text-blue-400"
                    )} />
                    <p className="text-sm font-medium">{alert.title}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", SEVERITY_BADGE[alert.severity])}>
                      {alert.severity}
                    </Badge>
                    <button onClick={() => setDismissed((s) => new Set(Array.from(s).concat(alert.id)))}
                      className="text-muted-foreground hover:text-foreground transition-colors">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-6">{alert.description}</p>
                {alert.source && (
                  <p className="text-[10px] text-muted-foreground pl-6 flex items-center gap-1">
                    <Info className="h-2.5 w-2.5" /> Source: {alert.source}
                  </p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!loading && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
            <CheckCircle className="h-8 w-8 text-green-400 opacity-60" />
            <p className="text-sm">No active alerts for {destination}</p>
            <p className="text-xs">Your trip looks clear!</p>
          </div>
        )}
      </div>
    </div>
  );
}
