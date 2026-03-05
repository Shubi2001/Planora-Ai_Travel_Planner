import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, MapPin, TrendingUp, Globe2, Mountain, Utensils, Landmark, Waves, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Explore Destinations — Planora" };

const FEATURED_DESTINATIONS = [
  { name: "Ladakh, India", tagline: "High-altitude deserts & mountain passes", tags: ["Adventure", "Nature", "Biking"], seed: "ladakh-india", color: "from-amber-500/80 to-orange-600/80", tripQuery: "Ladakh, India" },
  { name: "Rajasthan, India", tagline: "Palaces, forts & desert safaris", tags: ["History", "Culture", "Heritage"], seed: "rajasthan-india", color: "from-rose-500/80 to-pink-600/80", tripQuery: "Rajasthan, India" },
  { name: "Kerala, India", tagline: "Backwaters, tea gardens & Ayurveda", tags: ["Wellness", "Nature", "Culture"], seed: "kerala-india", color: "from-emerald-500/80 to-teal-600/80", tripQuery: "Kerala, India" },
  { name: "Goa, India", tagline: "Beaches, nightlife & Portuguese vibes", tags: ["Beach", "Party", "Food"], seed: "goa-india", color: "from-sky-500/80 to-blue-600/80", tripQuery: "Goa, India" },
  { name: "Himachal Pradesh", tagline: "Hills, valleys & adventure sports", tags: ["Mountains", "Trekking", "Snow"], seed: "himachal-india", color: "from-violet-500/80 to-purple-600/80", tripQuery: "Himachal Pradesh, India" },
  { name: "Uttarakhand, India", tagline: "Char Dham, Rishikesh & wildlife", tags: ["Pilgrimage", "Yoga", "Nature"], seed: "uttarakhand-india", color: "from-lime-500/80 to-green-600/80", tripQuery: "Uttarakhand, India" },
  { name: "Sikkim, India", tagline: "Northeast gems & Buddhist monasteries", tags: ["Nature", "Culture", "Trekking"], seed: "sikkim-india", color: "from-indigo-500/80 to-blue-600/80", tripQuery: "Sikkim, India" },
  { name: "Andaman & Nicobar", tagline: "Crystal waters & pristine islands", tags: ["Beach", "Diving", "Adventure"], seed: "andaman-india", color: "from-cyan-500/80 to-teal-600/80", tripQuery: "Andaman and Nicobar Islands, India" },
  { name: "Varanasi, India", tagline: "Spiritual capital on the Ganges", tags: ["Spiritual", "Culture", "History"], seed: "varanasi-india", color: "from-amber-500/80 to-yellow-600/80", tripQuery: "Varanasi, India" },
];

const CATEGORIES = [
  { icon: Waves, label: "Beaches", color: "text-sky-500", bg: "bg-sky-500/10 border-sky-500/20", query: "Goa Andaman beaches India" },
  { icon: Mountain, label: "Mountains", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", query: "Himachal Uttarakhand Ladakh mountains India" },
  { icon: Landmark, label: "Heritage", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", query: "Rajasthan forts palaces India" },
  { icon: Utensils, label: "Food Trails", color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20", query: "Indian food culinary Delhi Mumbai" },
  { icon: Globe2, label: "City Breaks", color: "text-violet-500", bg: "bg-violet-500/10 border-violet-500/20", query: "Mumbai Delhi Bangalore city India" },
  { icon: TreePine, label: "Wildlife", color: "text-teal-500", bg: "bg-teal-500/10 border-teal-500/20", query: "Ranthambore Jim Corbett wildlife India" },
];

const TRENDING = [
  { name: "Ladakh", emoji: "🏔️", trend: "+48%" },
  { name: "Goa", emoji: "🏖️", trend: "+42%" },
  { name: "Rajasthan", emoji: "🏰", trend: "+38%" },
  { name: "Kerala", emoji: "🛶", trend: "+35%" },
  { name: "Shimla", emoji: "🌲", trend: "+32%" },
  { name: "Rishikesh", emoji: "🧘", trend: "+28%" },
];

export default async function ExplorePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-10">

      {/* ── Hero ── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-8 md:p-12 text-white">
        <div className="absolute inset-0 opacity-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://picsum.photos/seed/world-travel-hero/1400/400"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/90 via-indigo-600/80 to-blue-700/90" />
        <div className="relative z-10">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <TrendingUp className="h-3 w-3 mr-1" /> India travel destinations
          </Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight">
            Explore India
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-xl mb-6">
            Discover destinations across India. Click any to generate an AI-powered itinerary.
          </p>
          <Button asChild size="lg" className="bg-white text-violet-700 hover:bg-white/90 font-semibold rounded-full gap-2">
            <Link href="/trips/new">
              <Sparkles className="h-4 w-4" />
              Plan a custom trip
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Categories ── */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={`/trips/new?destination=${encodeURIComponent(cat.query)}`}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${cat.bg}`}
            >
              <div className={`rounded-xl p-2.5 bg-background/50`}>
                <cat.icon className={`h-5 w-5 ${cat.color}`} />
              </div>
              <span className="text-xs font-medium leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Trending ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">Trending Right Now</h2>
          <Badge variant="secondary" className="gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-emerald-500" /> Updated weekly
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TRENDING.map((dest) => (
            <Link
              key={dest.name}
              href={`/trips/new?destination=${encodeURIComponent(dest.name)}`}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/80 px-4 py-3 hover:border-violet-500/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{dest.emoji}</span>
                <span className="text-sm font-medium group-hover:text-violet-400 transition-colors">{dest.name}</span>
              </div>
              <span className="text-xs text-emerald-500 font-semibold shrink-0">{dest.trend}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Featured Destinations ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">Featured Destinations</h2>
          <span className="text-sm text-muted-foreground">Click to plan with AI</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURED_DESTINATIONS.map((dest) => (
            <Link
              key={dest.name}
              href={`/trips/new?destination=${encodeURIComponent(dest.tripQuery)}`}
              className="group relative rounded-2xl overflow-hidden border border-border/60 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer block"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://picsum.photos/seed/${dest.seed}/600/300`}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={undefined}
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${dest.color} opacity-60 group-hover:opacity-70 transition-opacity`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* AI badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 px-2.5 py-1 text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-all">
                  <Sparkles className="h-3 w-3" />
                  Plan with AI
                </div>

                {/* Name on image */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-1.5 text-white mb-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-bold text-base drop-shadow">{dest.name}</span>
                  </div>
                  <p className="text-white/80 text-xs drop-shadow">{dest.tagline}</p>
                </div>
              </div>

              {/* Tags */}
              <div className="p-3 flex items-center justify-between bg-card">
                <div className="flex gap-1.5 flex-wrap">
                  {dest.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 p-8 text-center">
        <div className="text-4xl mb-3">🇮🇳</div>
        <h3 className="text-xl md:text-2xl font-bold mb-2">Have a destination in mind?</h3>
        <p className="text-muted-foreground mb-5 text-sm md:text-base max-w-md mx-auto">
          Type any city or region in India and let Planora AI build your perfect itinerary in seconds.
        </p>
        <Button asChild variant="gradient" size="lg" className="rounded-full gap-2 px-8">
          <Link href="/trips/new">
            <Sparkles className="h-4 w-4" />
            Start planning now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

    </div>
  );
}
