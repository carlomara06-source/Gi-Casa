import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { signPayload } from "@/lib/signature";
import { readJson } from "@/lib/http";

const Body = z.object({
  listingId: z.string(),
  amount: z.number().int().positive(),
  depositPct: z.number().int(),
  validDays: z.number().int(),
  conditions: z.array(z.string()),
  amlIdDone: z.boolean(),
  amlCfDone: z.boolean(),
  amlFundsDone: z.boolean(),
  otpId: z.string(),
  code: z.string().length(6),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const b = parsed.data;

  // A proposal is only ever created once it's actually signed — the OTP
  // check here is the buyer's FEA (advanced electronic signature).
  const otpResult = await verifyOtp(b.otpId, b.code);
  if (!otpResult.ok) {
    return NextResponse.json({ error: "otp_invalid", reason: otpResult.reason }, { status: 400 });
  }

  const foglio = await prisma.foglioVisita.findFirst({
    where: { userId: session.user.id, listingId: b.listingId },
  });
  if (!foglio) {
    return NextResponse.json({ error: "foglio_visita_required" }, { status: 403 });
  }

  if (!b.amlIdDone || !b.amlCfDone || !b.amlFundsDone) {
    return NextResponse.json({ error: "aml_incomplete" }, { status: 400 });
  }

  const depositCents = Math.round(((b.amount * b.depositPct) / 100 / 500)) * 500 * 100;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + b.validDays);

  const signatureHash = signPayload(
    { listingId: b.listingId, amount: b.amount, depositPct: b.depositPct, buyerId: session.user.id },
    b.otpId,
  );

  const proposal = await prisma.proposal.create({
    data: {
      listingId: b.listingId,
      buyerId: session.user.id,
      amount: b.amount,
      depositPct: b.depositPct,
      depositCents,
      validDays: b.validDays,
      conditions: b.conditions,
      status: "PENDING",
      amlIdDone: b.amlIdDone,
      amlCfDone: b.amlCfDone,
      amlFundsDone: b.amlFundsDone,
      signedAt: new Date(),
      signatureHash,
      expiresAt: validUntil,
    },
  });

  return NextResponse.json({ proposal });
}
