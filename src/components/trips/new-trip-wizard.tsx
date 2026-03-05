"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarIcon, MapPin, Users, Wallet, Sparkles, ArrowRight, ArrowLeft, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { createTripSchema } from "@/lib/validations/trip";
import TemplateSelector from "./template-selector";
import type { z } from "zod";

type CreateTripInput = z.input<typeof createTripSchema>;

const TRAVEL_STYLES = [
  { value: "adventure", label: "Adventure", emoji: "🧗" },
  { value: "luxury", label: "Luxury", emoji: "💎" },
  { value: "budget", label: "Budget", emoji: "💰" },
  { value: "family", label: "Family", emoji: "👨‍👩‍👧" },
  { value: "solo", label: "Solo", emoji: "🎒" },
  { value: "couple", label: "Couple", emoji: "💑" },
  { value: "group", label: "Group", emoji: "👥" },
  { value: "business", label: "Business", emoji: "💼" },
] as const;

const INTERESTS = [
  { value: "food", label: "Food", emoji: "🍜" },
  { value: "history", label: "History", emoji: "🏛️" },
  { value: "culture", label: "Culture", emoji: "🎭" },
  { value: "nature", label: "Nature", emoji: "🌿" },
  { value: "shopping", label: "Shopping", emoji: "🛍️" },
  { value: "nightlife", label: "Nightlife", emoji: "🌙" },
  { value: "art", label: "Art", emoji: "🎨" },
  { value: "sports", label: "Sports", emoji: "⚽" },
  { value: "beaches", label: "Beaches", emoji: "🏖️" },
  { value: "mountains", label: "Mountains", emoji: "⛰️" },
  { value: "photography", label: "Photography", emoji: "📸" },
  { value: "wellness", label: "Wellness", emoji: "🧘" },
] as const;

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "INR"];

const STEPS = [
  { label: "Template", icon: LayoutTemplate },
  { label: "Destination", icon: MapPin },
  { label: "Dates & Budget", icon: CalendarIcon },
  { label: "Style", icon: Sparkles },
];

export function NewTripWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();

  const {
    register,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<CreateTripInput>({
    resolver: zodResolver(createTripSchema),
    shouldUnregister: false,
    defaultValues: {
      currency: "USD",
      groupSize: 1,
      interests: [],
    },
  });

  // Pre-fill destination from ?destination= query param (from Explore page)
  useEffect(() => {
    const dest = searchParams.get("destination");
    if (dest) {
      setValue("destination", dest);
      // Skip template step and go straight to destination step
      setStep(1);
    }
  }, [searchParams, setValue]);

  // Validate step fields before advancing
  const goToStep = async (next: number) => {
    if (next > step) {
      if (step === 1) {
        const valid = await trigger(["title", "destination", "groupSize"]);
        if (!valid) return;
      }
      if (step === 2) {
        const valid = await trigger(["startDate", "endDate"]);
        if (!valid) return;
      }
    }
    setStep(next);
  };

  // Final submit — bypass handleSubmit to avoid multi-step unmount issues
  const handleGenerate = async () => {
    if (isLoading) return; // prevent double-submit
    const values = getValues();

    // Step 1 validation
    if (!values.title || values.title.trim().length < 3) {
      toast.error("Trip title must be at least 3 characters");
      setStep(1); return;
    }
    if (!values.destination || values.destination.trim().length < 2) {
      toast.error("Please enter a destination");
      setStep(1); return;
    }
    // Step 2 validation
    if (!values.startDate) {
      toast.error("Please select a start date");
      setStep(2); return;
    }
    if (!values.endDate) {
      toast.error("Please select an end date");
      setStep(2); return;
    }
    if (new Date(values.endDate as string) < new Date(values.startDate as string)) {
      toast.error("End date must be after start date");
      setStep(2); return;
    }

    await onSubmit(values);
  };

  const selectedStyle = watch("travelStyle");
  const selectedInterests = watch("interests") ?? [];

  // Apply template values to form
  const applyTemplate = (tmpl: { id: string; travelStyle: string; interests: string[]; estimatedBudget: number; currency: string; durationDays: number }) => {
    setSelectedTemplateId(tmpl.id);
    if (tmpl.travelStyle) setValue("travelStyle" as Parameters<typeof setValue>[0], tmpl.travelStyle as Parameters<typeof setValue>[1]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (tmpl.interests?.length) setValue("interests", tmpl.interests as any);
    if (tmpl.estimatedBudget) setValue("budget" as Parameters<typeof setValue>[0], tmpl.estimatedBudget as Parameters<typeof setValue>[1]);
    if (tmpl.currency) setValue("currency" as Parameters<typeof setValue>[0], tmpl.currency as Parameters<typeof setValue>[1]);
  };

  const toggleInterest = (interest: string) => {
    const current = (selectedInterests ?? []) as string[];
    const updated = current.includes(interest)
      ? current.filter((i: string) => i !== interest)
      : [...current, interest];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue("interests", updated as any);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // 1. Create the trip
      const createRes = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        toast.error(err.error ?? "Failed to create trip");
        return;
      }

      const { data: { trip } } = await createRes.json();

      toast.success("Trip created! Generating your itinerary...");
      router.push(`/trips/${trip.id}/edit?generate=true`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); void handleGenerate(); }}>
      {/* Step indicators */}
      <div className="flex items-center gap-1 md:gap-2 mb-5 md:mb-8 overflow-x-auto scrollbar-hide pb-1">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-1 md:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-all",
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                  ? "bg-primary/20 text-primary cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-default"
              )}
            >
              <s.icon className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" />
              <span className="hidden xs:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px w-4 md:w-6 bg-muted shrink-0", i < step && "bg-primary")} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0 — Template */}
      {step === 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <TemplateSelector
              selectedId={selectedTemplateId}
              onSelect={(tmpl) => {
                applyTemplate(tmpl);
              }}
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => goToStep(1)}>
                Skip — start from scratch
              </Button>
              <Button type="button" variant="gradient" className="flex-1 gap-2" onClick={() => goToStep(1)} disabled={!selectedTemplateId}>
                Use this template <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1 — Destination */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Trip title</label>
              <Input
                placeholder="e.g. Tokyo Cherry Blossom Adventure"
                error={errors.title?.message}
                {...register("title")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="e.g. Tokyo, Japan or Southeast Asia"
                  error={errors.destination?.message}
                  {...register("destination")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Group size</label>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setValue("groupSize", Math.max(1, (watch("groupSize") || 1) - 1))}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center font-medium">{watch("groupSize") || 1}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setValue("groupSize", Math.min(50, (watch("groupSize") || 1) + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="gradient"
              className="w-full gap-2"
              onClick={() => goToStep(2)}
            >
              Next: Dates & Budget
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Dates & Budget */}
      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start date</label>
                <Input
                  type="date"
                  min={format(new Date(), "yyyy-MM-dd")}
                  error={errors.startDate?.message}
                  {...register("startDate")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End date</label>
                <Input
                  type="date"
                  min={String(watch("startDate") || format(new Date(), "yyyy-MM-dd"))}
                  error={errors.endDate?.message}
                  {...register("endDate")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Total budget (optional)</label>
              <div className="flex gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  {...register("currency")}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="flex-1 relative">
                  <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    className="pl-9"
                    placeholder="e.g. 3000"
                    min={0}
                    {...register("budget", {
                      setValueAs: (v) => (v === "" || v === null || isNaN(Number(v)) ? undefined : Number(v)),
                    })}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Per group total. AI will optimize your itinerary to fit.
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 gap-2" onClick={() => goToStep(1)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button type="button" variant="gradient" className="flex-1 gap-2" onClick={() => goToStep(3)}>
                Next: Travel Style
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Travel Style */}
      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">Travel style</label>
              <div className="grid grid-cols-4 gap-2">
                {TRAVEL_STYLES.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => setValue("travelStyle", style.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all",
                      selectedStyle === style.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-input hover:border-primary/50 hover:bg-accent"
                    )}
                  >
                    <span className="text-2xl">{style.emoji}</span>
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">
                Interests{" "}
                <span className="text-muted-foreground font-normal">(select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest.value}
                    type="button"
                    onClick={() => toggleInterest(interest.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      selectedInterests.includes(interest.value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input hover:border-primary/50 hover:bg-accent"
                    )}
                  >
                    <span>{interest.emoji}</span>
                    {interest.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 gap-2" onClick={() => goToStep(2)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                variant="gradient"
                className="flex-1 gap-2"
                loading={isLoading}
                onClick={handleGenerate}
              >
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  );
}
