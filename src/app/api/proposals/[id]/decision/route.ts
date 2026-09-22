import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/http";

const Body = z.object({
  action: z.enum(["accept", "reject", "counter"]),
  counterAmount: z.number().int().positive().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await params;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const proposal = await prisma.proposal.findUnique({ where: { id }, include: { listing: true } });
  if (!proposal) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (proposal.listing.sellerId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (proposal.status !== "PENDING") {
    return NextResponse.json({ error: "already_decided" }, { status: 409 });
  }

  const { action, counterAmount } = parsed.data;

  if (action === "accept") {
    const updated = await prisma.proposal.update({
      where: { id },
      data: { status: "ACCEPTED", decidedAt: new Date() },
    });
    return NextResponse.json({ proposal: updated });
  }

  if (action === "reject") {
    const updated = await prisma.proposal.update({
      where: { id },
      data: { status: "REJECTED", decidedAt: new Date() },
    });
    return NextResponse.json({ proposal: updated });
  }

  // counter
  if (!counterAmount) return NextResponse.json({ error: "counter_amount_required" }, { status: 400 });

  const [updated, counter] = await prisma.$transaction([
    prisma.proposal.update({ where: { id }, data: { status: "COUNTERED", decidedAt: new Date() } }),
    prisma.proposal.create({
      data: {
        listingId: proposal.listingId,
        buyerId: proposal.buyerId,
        amount: counterAmount,
        depositPct: proposal.depositPct,
        depositCents: proposal.depositCents,
        validDays: 5,
        conditions: proposal.conditions,
        status: "PENDING",
        counterOfId: proposal.id,
        expiresAt: (() => {
          const d = new Date();
          d.setDate(d.getDate() + 5);
          return d;
        })(),
      },
    }),
  ]);

  return NextResponse.json({ proposal: updated, counter });
}
