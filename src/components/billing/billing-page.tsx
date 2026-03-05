"use client";

import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, Crown, Zap, CreditCard, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/stripe";
import type { Subscription } from "@prisma/client";

interface BillingPageProps {
  subscription: Subscription | null;
}

export function BillingPage({ subscription }: BillingPageProps) {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(false);

  const isPro = subscription?.plan === "PRO" && subscription.status === "ACTIVE";

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingInterval,
          priceId: billingInterval === "yearly"
            ? PLANS.PRO.priceIdYearly
            : PLANS.PRO.priceIdMonthly,
        }),
      });

      const { data } = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to start checkout");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your plan and payment details.</p>
      </div>

      {/* Current plan */}
      {subscription && (
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className={`h-4 w-4 ${isPro ? "text-amber-500" : "text-muted-foreground"}`} />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold">{subscription.plan}</span>
                  <Badge variant={isPro ? "default" : "secondary"}>
                    {subscription.status.toLowerCase()}
                  </Badge>
                </div>
                {subscription.currentPeriodEnd && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {subscription.cancelAtPeriodEnd
                      ? `Cancels on ${format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy")}`
                      : `Renews on ${format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy")}`}
                  </p>
                )}
              </div>
              {isPro && (
                <Button variant="outline" size="sm" className="gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  Manage billing
                </Button>
              )}
            </div>

            {/* Usage */}
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">AI Generations</p>
                <p className="font-semibold">
                  {subscription.aiCallsUsed} /{" "}
                  {subscription.aiCallsLimit === -1 ? "∞" : subscription.aiCallsLimit}
                </p>
                <p className="text-xs text-muted-foreground">this month</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">Trip Slots</p>
                <p className="font-semibold">
                  {subscription.tripsLimit === -1 ? "Unlimited" : subscription.tripsLimit}
                </p>
                <p className="text-xs text-muted-foreground">active trips</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade card */}
      {!isPro && (
        <div>
          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className={`text-sm ${billingInterval === "monthly" ? "font-medium" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === "monthly" ? "yearly" : "monthly")}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-primary transition-transform ${
                  billingInterval === "yearly" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm ${billingInterval === "yearly" ? "font-medium" : "text-muted-foreground"}`}>
              Yearly
              <Badge variant="success" className="ml-2 text-xs">Save 30%</Badge>
            </span>
          </div>

          <Card className="border-2 border-primary relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-4">Recommended</Badge>
            </div>

            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-2">
                <Crown className="h-6 w-6 text-amber-500" />
                <h2 className="text-2xl font-bold">Pro Plan</h2>
              </div>
              <p className="text-muted-foreground mb-4">{PLANS.PRO.description}</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">
                  ${billingInterval === "yearly"
                    ? Math.round(PLANS.PRO.priceYearly / 12)
                    : PLANS.PRO.priceMonthly}
                </span>
                <span className="text-muted-foreground">/month</span>
                {billingInterval === "yearly" && (
                  <span className="text-sm text-muted-foreground ml-2">
                    billed ${PLANS.PRO.priceYearly}/year
                  </span>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-2 mb-8">
                {PLANS.PRO.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              <Button
                variant="gradient"
                size="xl"
                className="w-full gap-2"
                onClick={handleUpgrade}
                loading={isLoading}
              >
                <Zap className="h-5 w-5" />
                Upgrade to Pro — Start 14-day free trial
              </Button>

              <p className="text-center text-xs text-muted-foreground mt-3">
                No credit card required for trial. Cancel anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
