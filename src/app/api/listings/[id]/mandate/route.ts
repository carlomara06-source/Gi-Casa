import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { signPayload } from "@/lib/signature";
import { readJson } from "@/lib/http";

const Body = z.object({ otpId: z.string(), code: z.string().length(6) });

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await params;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const listing = await prisma.listing.findUnique({ where: { id }, include: { mandate: true } });
  if (!listing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (listing.sellerId !== session.user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (listing.mandate) return NextResponse.json({ error: "already_signed" }, { status: 409 });

  const otpResult = await verifyOtp(parsed.data.otpId, parsed.data.code);
  if (!otpResult.ok) return NextResponse.json({ error: "otp_invalid" }, { status: 400 });

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + 6);
  const withdrawableFrom = new Date(now);
  withdrawableFrom.setDate(withdrawableFrom.getDate() + 30);

  const signatureHash = signPayload({ listingId: id, sellerId: session.user.id }, parsed.data.otpId);

  const [mandate] = await prisma.$transaction([
    prisma.mandate.create({
      data: { listingId: id, signedAt: now, expiresAt, withdrawableFrom, signatureHash },
    }),
    prisma.listing.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: now } }),
  ]);

  return NextResponse.json({ mandate });
}
