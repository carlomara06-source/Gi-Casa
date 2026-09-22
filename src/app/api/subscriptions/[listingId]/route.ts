import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/http";
import { stripe, stripeConfigured } from "@/lib/stripe";

const Body = z.object({ action: z.enum(["pause", "resume", "downgrade"]) });

export async function POST(req: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { listingId } = await params;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { subscription: true } });
  if (!listing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (listing.sellerId !== session.user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { action } = parsed.data;
  const stripeSubId = listing.subscription?.stripeSubscriptionId;
  const canSyncStripe = stripeConfigured() && Boolean(stripeSubId);

  if (action === "pause") {
    if (canSyncStripe) await stripe.subscriptions.update(stripeSubId!, { pause_collection: { behavior: "void" } });
    await prisma.$transaction([
      prisma.subscription.update({ where: { listingId }, data: { status: "PAUSED" } }),
      prisma.listing.update({ where: { id: listingId }, data: { status: "PAUSED" } }),
    ]);
  } else if (action === "resume") {
    if (canSyncStripe) await stripe.subscriptions.update(stripeSubId!, { pause_collection: null });
    await prisma.$transaction([
      prisma.subscription.update({ where: { listingId }, data: { status: "ACTIVE" } }),
      prisma.listing.update({ where: { id: listingId }, data: { status: "PUBLISHED" } }),
    ]);
  } else {
    if (canSyncStripe) await stripe.subscriptions.cancel(stripeSubId!);
    await prisma.subscription.update({
      where: { listingId },
      data: { plan: "FREE", status: "ACTIVE", stripeSubscriptionId: null, currentPeriodEnd: null },
    });
  }

  const subscription = await prisma.subscription.findUnique({ where: { listingId } });
  return NextResponse.json({ subscription });
}
