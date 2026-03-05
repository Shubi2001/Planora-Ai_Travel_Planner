import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Sparkles,
  Globe2,
  Users,
  BarChart3,
  CloudSun,
  ArrowRight,
  Check,
  Star,
  Zap,
  Route,
  Shield,
  Bell,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Itinerary Generator",
    description:
      "Describe your dream trip and watch Planora craft a detailed day-by-day itinerary with timings, costs, and local insider tips.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    icon: MapPin,
    title: "Interactive Map",
    description:
      "Visualize every activity as a pin. Drag to reorder and the map updates in real time with optimized walking routes.",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  {
    icon: BarChart3,
    title: "Smart Budget Engine",
    description:
      "Auto-calculated cost breakdowns by category. Currency conversion, per-person estimates, and budget sliders.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    icon: CloudSun,
    title: "Live Weather Forecasts",
    description:
      "Daily forecasts for your exact travel dates with packing suggestions and weather-aware activity recommendations.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description:
      "Invite travel companions. Assign roles, leave comments, vote on activities — plan together from anywhere.",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
  },
  {
    icon: Globe2,
    title: "Shareable Trip Pages",
    description:
      "One-click public trip pages. Beautiful cover images, full itinerary view — perfect for sharing with friends.",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
  {
    icon: Route,
    title: "PDF & Calendar Export",
    description:
      "Download a print-ready PDF or sync your trip directly to Google Calendar or Apple Calendar in one click.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    icon: Shield,
    title: "Emergency Info",
    description:
      "Auto-populated country-specific emergency numbers, nearest hospitals, and embassy contacts for every trip.",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  {
    icon: Bell,
    title: "Live Travel Alerts",
    description:
      "Real-time weather alerts, road closures, local events, and safety advisories delivered right to your itinerary.",
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "Digital Nomad",
    avatar: "SC",
    avatarBg: "from-violet-400 to-pink-400",
    text: "I planned a 2-week Japan trip in under 10 minutes. Planora knew exactly what I wanted and the map routing saved us hours every day.",
    rating: 5,
  },
  {
    name: "Marco Rivera",
    role: "Travel Blogger",
    avatar: "MR",
    avatarBg: "from-sky-400 to-indigo-400",
    text: "The collaboration feature is a game-changer. My travel group can all suggest changes and vote on activities in real time.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Adventure Traveler",
    avatar: "PS",
    avatarBg: "from-emerald-400 to-teal-400",
    text: "Budget tracking alone is worth it. I always overspent before — now I stay perfectly on track with the smart budget engine.",
    rating: 5,
  },
];

const STATS = [
  { value: "50K+", label: "Trips planned" },
  { value: "120+", label: "Countries covered" },
  { value: "4.9★", label: "Average rating" },
  { value: "2 min", label: "Avg. generation time" },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow">
              <span className="text-white text-sm font-black">P</span>
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border-2 border-background" />
            </div>
            <span className="gradient-heading tracking-tight">Planora</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Sign in
            </Link>
            <Button asChild size="sm" variant="gradient" className="rounded-full px-5">
              <Link href="/register">Sign up free</Link>
            </Button>
          </div>

          {/* Mobile: Sign in + Sign up */}
          <div className="md:hidden flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium text-foreground px-3 py-2">
              Sign in
            </Link>
            <Button asChild size="sm" variant="gradient" className="rounded-full">
              <Link href="/register">Sign up</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-24 md:py-40">
        {/* Layered background blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[20%] w-[700px] h-[700px] bg-gradient-to-br from-violet-500/15 to-indigo-500/15 blur-3xl rounded-full" />
          <div className="absolute bottom-[-5%] right-[10%] w-[500px] h-[500px] bg-gradient-to-br from-pink-500/10 to-rose-500/10 blur-3xl rounded-full" />
          <div className="absolute top-[30%] right-[30%] w-[300px] h-[300px] bg-emerald-500/8 blur-3xl rounded-full" />
        </div>

        <div className="container text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-4 py-1.5 text-sm rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Zap className="h-3.5 w-3.5" />
            Powered by Groq · Lightning fast AI
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Your AI travel companion,{" "}
            <span className="gradient-heading">reimagined</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Tell Planora where you want to go. Get a gorgeous, fully-planned
            itinerary with maps, weather, budgets, and more — in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="xl" variant="gradient" className="gap-2 rounded-full px-8 shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow">
              <Link href="/register">
                Start planning for free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="rounded-full px-8 border-border/60">
              <Link href="#features">See all features</Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required &middot; Free plan: 3 trips + 10 AI generations
          </p>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
                <div className="text-2xl font-bold gradient-heading">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-muted/20">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400">
              Everything you need
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              One platform for the{" "}
              <span className="gradient-heading">entire journey</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              From AI generation to real-time collaboration — all the tools a modern traveler needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className={`group rounded-2xl border ${feature.border} bg-card/80 p-6 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`inline-flex rounded-xl p-3 mb-4 ${feature.bg} border ${feature.border}`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-400">
              Traveler stories
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Loved by <span className="gradient-heading">wanderers</span> worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border/60 bg-card/80 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${t.avatarBg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-muted/20">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Pricing
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Simple, <span className="gradient-heading">honest pricing</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Start free. Upgrade when you need more.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-border/60 bg-card p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Free</h3>
                <p className="text-muted-foreground text-sm">Get started at no cost</p>
              </div>
              <div className="text-4xl font-extrabold mb-6">$0</div>
              <ul className="space-y-3 mb-8">
                {["3 active trips", "10 AI generations/month", "Interactive map", "Budget tracking", "Basic collaboration"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-emerald-500" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href="/register">Get started free</Link>
              </Button>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-primary/60 bg-card p-8 relative shadow-xl shadow-violet-500/10">
              <Badge className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 rounded-full px-4">
                Most Popular
              </Badge>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Pro</h3>
                <p className="text-muted-foreground text-sm">For serious travelers</p>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold">$12</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited trips",
                  "Unlimited AI generations",
                  "Advanced map + routing",
                  "Live weather forecasts",
                  "Collaboration (10 members)",
                  "PDF & calendar export",
                  "Emergency info + alerts",
                  "Version history",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant="gradient" className="w-full rounded-xl">
                <Link href="/register">Start 14-day free trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-indigo-600/5 to-pink-600/5" />
        </div>
        <div className="container text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/25 mb-8 mx-auto">
            <span className="text-white text-2xl font-black">P</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            Ready for your next{" "}
            <span className="gradient-heading">adventure?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto font-light">
            Join thousands of travelers who plan smarter with Planora.
          </p>
          <Button asChild size="xl" variant="gradient" className="gap-2 rounded-full px-10 shadow-xl shadow-violet-500/25">
            <Link href="/register">
              Start for free today
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-xs font-black">P</span>
              </div>
              <span className="gradient-heading">Planora</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              © 2026 Planora. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
