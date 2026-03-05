import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return _stripe;
}

// For backward compatibility, lazy getter
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

export const PLANS = {
  FREE: {
    name: "Free",
    description: "Perfect for occasional travelers",
    price: 0,
    priceId: null,
    features: [
      "3 active trips",
      "10 AI generations/month",
      "Basic map view",
      "Budget tracking",
    ],
    limits: {
      trips: 3,
      aiCalls: 10,
    },
  },
  PRO: {
    name: "Pro",
    description: "For serious travel enthusiasts",
    priceMonthly: 12,
    priceYearly: 99,
    priceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
    priceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? "",
    features: [
      "Unlimited trips",
      "Unlimited AI generations",
      "Advanced map with routing",
      "Budget engine with currency conversion",
      "Collaboration (up to 10 members)",
      "Weather forecasts",
      "PDF export",
      "Version history",
      "Priority support",
    ],
    limits: {
      trips: -1,
      aiCalls: -1,
    },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
