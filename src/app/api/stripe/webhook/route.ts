import { type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";
import { createLogger } from "@/lib/logger";

const log = createLogger("stripe:webhook");

export const runtime = "nodejs";

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  if (!userId) {
    log.warn({ subscriptionId: subscription.id }, "No userId in subscription metadata");
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const isPro = priceId === process.env.STRIPE_PRICE_PRO_MONTHLY || 
                priceId === process.env.STRIPE_PRICE_PRO_YEARLY;

  const statusMap: Record<Stripe.Subscription.Status, string> = {
    active: "ACTIVE",
    canceled: "CANCELED",
    incomplete: "INCOMPLETE",
    incomplete_expired: "CANCELED",
    past_due: "PAST_DUE",
    trialing: "TRIALING",
    unpaid: "PAST_DUE",
    paused: "CANCELED",
  };

  await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      plan: isPro ? "PRO" : "FREE",
      status: (statusMap[subscription.status] ?? "ACTIVE") as "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" | "INCOMPLETE",
      currentPeriodStart: subscription.billing_cycle_anchor ? new Date(subscription.billing_cycle_anchor * 1000) : null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      tripsLimit: isPro ? -1 : 3,
      aiCallsLimit: isPro ? -1 : 10,
    },
    update: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      plan: isPro ? "PRO" : "FREE",
      status: (statusMap[subscription.status] ?? "ACTIVE") as "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" | "INCOMPLETE",
      currentPeriodStart: subscription.billing_cycle_anchor ? new Date(subscription.billing_cycle_anchor * 1000) : null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      tripsLimit: isPro ? -1 : 3,
      aiCallsLimit: isPro ? -1 : 10,
    },
  });

  log.info({ userId, plan: isPro ? "PRO" : "FREE", status: subscription.status }, "Subscription updated");
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    log.error({ err }, "Webhook signature verification failed");
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : "Unknown"}`, { status: 400 });
  }

  log.info({ type: event.type, id: event.id }, "Stripe webhook received");

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await handleSubscriptionUpsert(sub);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata.userId;
        if (userId) {
          await db.subscription.update({
            where: { userId },
            data: {
              plan: "FREE",
              status: "CANCELED",
              tripsLimit: 3,
              aiCallsLimit: 10,
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          const userId = sub.metadata.userId;
          if (userId) {
            await db.subscription.update({
              where: { userId },
              data: { status: "PAST_DUE" },
            });
          }
        }
        break;
      }

      default:
        log.debug({ type: event.type }, "Unhandled webhook event");
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    log.error({ err, eventType: event.type }, "Webhook handler error");
    return new Response("Webhook handler failed", { status: 500 });
  }
}
