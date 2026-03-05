"use client";

import { Phone, Hospital, Building2, AlertTriangle, MapPin, ExternalLink, Shield } from "lucide-react";
import { getEmergencyInfo } from "@/lib/data/emergency-data";
import { Badge } from "@/components/ui/badge";

export default function EmergencyPanel({ destination }: { destination: string }) {
  const info = getEmergencyInfo(destination);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-400" />
          Emergency Information
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {info ? `For ${info.country}` : `For ${destination}`}
        </p>
      </div>

      {!info ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <AlertTriangle className="h-4 w-4 mb-2" />
          Emergency data not available for this destination. Always research local emergency numbers before travel.
        </div>
      ) : (
        <>
          {/* Travel alert */}
          {info.travelAlert && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed">{info.travelAlert}</p>
            </div>
          )}

          {/* Emergency numbers */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Emergency Numbers</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Police", number: info.police, color: "text-blue-400" },
                { label: "Ambulance", number: info.ambulance, color: "text-green-400" },
                { label: "Fire", number: info.fire, color: "text-orange-400" },
                { label: "General", number: info.general, color: "text-violet-400" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={`tel:${item.number}`}
                  className="flex items-center gap-2 rounded-lg border border-input bg-muted/30 px-3 py-2.5 hover:bg-accent transition-colors group"
                >
                  <Phone className={`h-3.5 w-3.5 ${item.color}`} />
                  <div>
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    <p className={`font-bold text-sm ${item.color}`}>{item.number}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Nearest hospital */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Hospital className="h-3.5 w-3.5 text-red-400" /> Nearest Major Hospital
            </p>
            <div className="space-y-1.5">
              <p className="font-medium text-sm">{info.hospital.name}</p>
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {info.hospital.address}
              </p>
              <div className="flex gap-2 mt-2">
                <a href={`tel:${info.hospital.phone}`}
                  className="flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/20 transition-colors">
                  <Phone className="h-3 w-3" /> {info.hospital.phone}
                </a>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(info.hospital.mapQuery)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  <MapPin className="h-3 w-3" /> View on Map <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Embassy contacts */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-violet-400" /> Embassy Contacts
            </p>
            {info.embassy.map((emb) => (
              <div key={emb.country} className="space-y-1 pb-3 border-b last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{emb.country}</Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0 mt-0.5" /> {emb.address}
                </p>
                <a href={`tel:${emb.phone}`}
                  className="flex items-center gap-1.5 text-xs text-green-400 hover:underline">
                  <Phone className="h-3 w-3" /> {emb.phone}
                </a>
              </div>
            ))}
          </div>

          {/* General safety tips */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Travel Safety Tips</p>
            {[
              "Always carry a photocopy of your passport",
              "Keep emergency contacts saved offline",
              "Register with your country's embassy online",
              "Get comprehensive travel insurance",
              "Share your itinerary with someone at home",
            ].map((tip) => (
              <p key={tip} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-violet-400 shrink-0">•</span> {tip}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
