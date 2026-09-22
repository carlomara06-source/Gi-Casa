import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/otp";
import { readJson } from "@/lib/http";

const Body = z.object({
  phone: z.string().min(6),
  purpose: z.enum(["LOGIN", "FOGLIO_VISITA", "FEA_SIGNATURE"]),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await sendOtp(parsed.data.phone, parsed.data.purpose);

  // devCode is only ever present when Twilio isn't configured (sandbox
  // fallback) — surfacing it in the response is what lets this environment's
  // UI show "demo: enter any 6 digits" without needing real SMS delivery.
  return NextResponse.json({
    otpId: result.id,
    mode: result.mode,
    devCode: result.mode === "dev" ? result.devCode : undefined,
  });
}
