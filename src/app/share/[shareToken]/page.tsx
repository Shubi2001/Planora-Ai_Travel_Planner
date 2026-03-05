import { Metadata } from "next";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { MapPin, Calendar, Users, Heart, Eye, Sparkles, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ShareVoteButton from "@/components/shared/share-vote-button";
import { SharePageActions } from "@/components/shared/share-page-actions";

interface SharePageProps {
  params: Promise<{ shareToken: string }>;
}

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: "🍽️", ATTRACTION: "🏛️", HOTEL: "🏨", TRANSPORT: "🚌",
  SHOPPING: "🛍️", ENTERTAINMENT: "🎭", NATURE: "🌿", CULTURE: "🎨",
  SPORT: "⚽", OTHER: "📍",
};

const TIMESLOT_COLORS: Record<string, string> = {
  morning: "bg-amber-500/20 text-amber-400",
  afternoon: "bg-blue-500/20 text-blue-400",
  evening: "bg-violet-500/20 text-violet-400",
};

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { shareToken } = await params;
  const trip = await db.trip.findUnique({
    where: { shareToken, isPublic: true },
    select: { title: true, destination: true, description: true },
  });
  if (!trip) return { title: "Trip not found" };

  const destSeed = trip.destination.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 30);
  const imgUrl = `https://picsum.photos/seed/${destSeed}/1200/630`;

  return {
    title: `${trip.title} — Planora`,
    description: trip.description ?? `Explore this trip to ${trip.destination} planned with Planora`,
    openGraph: {
      title: trip.title,
      description: `A trip to ${trip.destination}`,
      images: [{ url: imgUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: trip.title,
      images: [imgUrl],
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { shareToken } = await params;

  const trip = await db.trip.findUnique({
    where: { shareToken, isPublic: true },
    include: {
      days: {
        orderBy: { sortOrder: "asc" },
        include: { activities: { orderBy: { sortOrder: "asc" } } },
      },
      budget: true,
      user: { select: { name: true, image: true } },
    },
  });

  if (!trip) notFound();

  await db.trip.update({
    where: { id: trip.id },
    data: { shareViewCount: { increment: 1 } },
  });

  const totalDays = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const totalActivities = trip.days.reduce((sum, d) => sum + d.activities.length, 0);
  const heroSeed = trip.destination.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 30);
  const heroBg = `https://picsum.photos/seed/${heroSeed}-hero/1600/600`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-14">
          <a href="/" className="flex items-center gap-2.5 font-bold text-base">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <span className="text-white text-xs font-black">P</span>
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 border border-background" />
            </div>
            <span className="gradient-heading hidden sm:block tracking-tight">Planora</span>
          </a>
          <a
            href="/register"
            className="text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
          >
            Plan your own trip →
          </a>
        </div>
      </header>

      {/* Hero */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img src={heroBg} alt={trip.destination} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container pb-8">
          <Badge className="mb-3 bg-violet-500/20 text-violet-300 border-violet-500/30">
            <Sparkles className="h-3 w-3 mr-1" /> AI-Generated Itinerary
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{trip.title}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-violet-300" /> {trip.destination}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-violet-300" />
              {format(new Date(trip.startDate), "MMM d")} – {format(new Date(trip.endDate), "MMM d, yyyy")} · {totalDays} days
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-violet-300" />
              {trip.groupSize} {trip.groupSize === 1 ? "traveler" : "travelers"}
            </span>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl py-8 space-y-8">
        {/* Meta bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 bg-card">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {trip.user.image ? (
                <img src={trip.user.image} alt={trip.user.name ?? ""} className="h-7 w-7 rounded-full" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">
                  {trip.user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
              <span>by <strong className="text-foreground">{trip.user.name}</strong></span>
            </div>
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {trip.shareViewCount.toLocaleString()} views</span>
            <span>{totalActivities} activities</span>
            {trip.budget && (
              <span className="text-emerald-400 font-medium">
                {trip.currency} {trip.budget.total.toLocaleString()} budget
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <SharePageActions shareUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/share/${shareToken}`} />
            <ShareVoteButton tripId={trip.id} initialVotes={trip.voteCount} />
          </div>
        </div>

        {trip.description && (
          <p className="text-muted-foreground text-base leading-relaxed">{trip.description}</p>
        )}

        {/* Itinerary days */}
        <div className="space-y-10">
          {trip.days.map((day) => (
            <div key={day.id}>
              {/* Day header */}
              <div className="flex items-center gap-4 mb-5">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex flex-col items-center justify-center text-white flex-shrink-0">
                  <span className="text-[10px] font-medium uppercase">Day</span>
                  <span className="text-lg font-bold leading-none">{day.dayNumber}</span>
                </div>
                <div>
                  <h2 className="font-bold text-xl">{day.title ?? `Day ${day.dayNumber}`}</h2>
                  <p className="text-sm text-muted-foreground">{format(new Date(day.date), "EEEE, MMMM d, yyyy")}</p>
                </div>
              </div>

              {day.notes && (
                <div className="ml-16 mb-4 rounded-xl bg-muted/50 border px-4 py-3 text-sm text-muted-foreground italic">
                  {day.notes}
                </div>
              )}

              {/* Timeline */}
              <div className="ml-6 border-l border-border pl-8 space-y-4">
                {day.activities.map((activity) => (
                  <div key={activity.id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[2.6rem] top-3 h-4 w-4 rounded-full border-2 border-violet-500 bg-background" />

                    <div className="rounded-2xl border bg-card p-4 hover:border-violet-500/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{CATEGORY_EMOJI[activity.category] ?? "📍"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${TIMESLOT_COLORS[activity.timeSlot] ?? "bg-muted text-muted-foreground"}`}>
                                  {activity.timeSlot}
                                </span>
                                <Badge variant="outline" className="text-[11px] h-5">{activity.category.toLowerCase()}</Badge>
                              </div>
                              <h3 className="font-semibold text-base">{activity.title}</h3>
                            </div>
                            {(activity.estimatedCost || activity.isFree) && (
                              <div className="text-right flex-shrink-0">
                                {activity.isFree ? (
                                  <span className="text-sm text-emerald-400 font-medium">Free</span>
                                ) : (
                                  <span className="text-sm font-medium">{trip.currency} {activity.estimatedCost?.toLocaleString()}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{activity.description}</p>
                          )}

                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            {activity.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{activity.location}</span>}
                            {activity.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{Math.floor(activity.duration / 60)}h{activity.duration % 60 > 0 ? ` ${activity.duration % 60}m` : ""}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Budget summary */}
        {trip.budget && (
          <div className="rounded-2xl border bg-card p-6 space-y-3">
            <h3 className="font-semibold text-lg">Budget Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Food", value: trip.budget.food },
                { label: "Transport", value: trip.budget.transport },
                { label: "Activities", value: trip.budget.activities },
                { label: "Accommodation", value: trip.budget.accommodation },
                { label: "Shopping", value: trip.budget.shopping },
                { label: "Total", value: trip.budget.total, highlight: true },
              ].filter(i => i.value > 0).map((item) => (
                <div key={item.label} className={`rounded-xl p-3 ${item.highlight ? "bg-violet-500/10 border border-violet-500/20" : "bg-muted/50"}`}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`font-bold ${item.highlight ? "text-violet-400" : ""}`}>{trip.currency} {item.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-700" />
          <div className="relative px-8 py-12 text-center text-white space-y-4">
            <Sparkles className="h-8 w-8 mx-auto opacity-80" />
            <h3 className="text-2xl font-bold">Inspired? Plan your own adventure</h3>
            <p className="text-white/80 max-w-md mx-auto">
              Create personalized AI itineraries, track your budget, collaborate with friends, and more — free to get started.
            </p>
            <a
              href="/register"
              className="inline-block bg-white text-violet-700 font-bold px-8 py-3 rounded-xl hover:bg-violet-50 transition-colors text-sm"
            >
              Start planning for free →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
