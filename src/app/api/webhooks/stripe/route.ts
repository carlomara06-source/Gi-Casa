import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { Plan } from "@/generated/prisma/enums";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook_not_configured" }, { status: 501 });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const listingId = session.metadata?.listingId;
      const plan = session.metadata?.plan as Plan | undefined;
      const cycle = session.metadata?.cycle as "WEEK" | "FOUR_WEEK" | undefined;
      if (listingId && plan) {
        await prisma.subscription.update({
          where: { listingId },
          data: {
            plan,
            cycle: cycle ?? "WEEK",
            status: "ACTIVE",
            stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
            stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
          },
        });
        await prisma.listing.update({ where: { id: listingId }, data: { status: "PUBLISHED" } });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { plan: "FREE", status: "ACTIVE", stripeSubscriptionId: null },
      });
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const paused = Boolean(sub.pause_collection);
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: paused ? "PAUSED" : "ACTIVE" },
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
