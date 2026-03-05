import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, PLANS } from "@/lib/stripe";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError } from "@/lib/utils/api-response";

const checkoutSchema = z.object({
  priceId: z.string(),
  billingInterval: z.enum(["monthly", "yearly"]).default("monthly"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const userId = session.user.id;
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) return errorResponse("User not found", 404);

    const body = await req.json();
    const { billingInterval } = checkoutSchema.parse(body);

    const priceId =
      billingInterval === "yearly"
        ? PLANS.PRO.priceIdYearly
        : PLANS.PRO.priceIdMonthly;

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.name ?? undefined,
        metadata: { userId },
      });

      await db.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });

      customerId = customer.id;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId },
      },
      metadata: { userId },
      allow_promotion_codes: true,
    });

    return successResponse({ url: checkoutSession.url, sessionId: checkoutSession.id });
  } catch (err) {
    return handleApiError(err);
  }
}
