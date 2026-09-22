import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { sendOtp } from "@/lib/otp";
import { readJson } from "@/lib/http";

// For OTP flows that happen while the user is already authenticated (FEA
// signature on a proposal or mandate): the phone number comes from the
// session, not from client input, so it can't be spoofed to send someone
// else's SMS or sign as a different phone number.
const Body = z.object({ purpose: z.enum(["FEA_SIGNATURE", "FOGLIO_VISITA"]) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const result = await sendOtp(session.user.phone, parsed.data.purpose);
  return NextResponse.json({
    otpId: result.id,
    mode: result.mode,
    devCode: result.mode === "dev" ? result.devCode : undefined,
  });
}
