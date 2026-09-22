import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/http";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const threads = await prisma.chatThread.findMany({
    where: {
      OR: [
        { buyerId: session.user.id },
        { listing: { sellerId: session.user.id } },
      ],
    },
    include: {
      listing: { include: { seller: true } },
      buyer: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    threads: threads.map((t) => {
      const isSeller = t.listing?.sellerId === session.user.id;
      const counterpart = isSeller ? `Acquirente #${t.buyerId.slice(-4).toUpperCase()}` : (t.listing?.seller.name ?? "Venditore");
      return {
        id: t.id,
        kind: t.kind,
        property: t.listing ? `${t.listing.addressLine}, ${t.listing.city}` : null,
        who: t.kind === "SUPPORT" ? "Assistenza Giàcasa" : counterpart,
        preview: t.messages[0]?.body ?? "Nessun messaggio ancora.",
        time: t.messages[0]?.createdAt.toISOString() ?? t.createdAt.toISOString(),
      };
    }),
  });
}

const Body = z.object({
  listingId: z.string().optional(),
  kind: z.enum(["BUYER_SELLER", "SUPPORT"]).default("BUYER_SELLER"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const { listingId, kind } = parsed.data;

  if (kind === "SUPPORT") {
    const existing = await prisma.chatThread.findFirst({ where: { buyerId: session.user.id, kind: "SUPPORT" } });
    const thread = existing ?? (await prisma.chatThread.create({ data: { buyerId: session.user.id, kind: "SUPPORT" } }));
    return NextResponse.json({ thread });
  }

  if (!listingId) return NextResponse.json({ error: "listing_id_required" }, { status: 400 });
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // The buyer side of a listing thread is always the visitor who isn't the
  // seller — sellers reach their threads through the listing's thread list.
  const buyerId = listing.sellerId === session.user.id ? null : session.user.id;
  if (!buyerId) return NextResponse.json({ error: "sellers_cannot_start_their_own_thread" }, { status: 400 });

  const existing = await prisma.chatThread.findFirst({ where: { listingId, buyerId, kind: "BUYER_SELLER" } });
  const thread =
    existing ?? (await prisma.chatThread.create({ data: { listingId, buyerId, kind: "BUYER_SELLER" } }));

  return NextResponse.json({ thread });
}
