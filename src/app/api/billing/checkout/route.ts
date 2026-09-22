import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, stripeConfigured, priceIdForPlan } from "@/lib/stripe";
import { readJson } from "@/lib/http";
import type { PlanId } from "@/lib/plans";

const Body = z.object({
  listingId: z.string(),
  plan: z.enum(["VISIBILITY_BOOST", "SMART_AGENT", "CONCIERGE_LUXURY"]),
  cycle: z.enum(["WEEK", "FOUR_WEEK"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const { listingId, plan, cycle } = parsed.data;

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { subscription: true } });
  if (!listing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (listing.sellerId !== session.user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Sandbox fallback: without real Stripe keys, activate the plan directly
  // so the flow stays clickable end-to-end — see .env.example.
  if (!stripeConfigured() || !priceIdForPlan(plan as PlanId)) {
    await prisma.subscription.update({
      where: { listingId },
      data: { plan, cycle, status: "ACTIVE" },
    });
    await prisma.listing.update({ where: { id: listingId }, data: { status: "PUBLISHED" } });
    return NextResponse.json({ mode: "demo", redirectUrl: `/venditore?activated=${plan}` });
  }

  let customerId = listing.subscription?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      phone: session.user.phone,
      metadata: { userId: session.user.id, listingId },
    });
    customerId = customer.id;
  }

  const origin = new URL(req.url).origin;
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceIdForPlan(plan as PlanId), quantity: 1 }],
    success_url: `${origin}/venditore?activated=${plan}`,
    cancel_url: `${origin}/abbonamenti?listingId=${listingId}`,
    metadata: { listingId, plan, cycle },
    subscription_data: { metadata: { listingId, plan, cycle } },
  });

  return NextResponse.json({ mode: "stripe", redirectUrl: checkoutSession.url });
}
