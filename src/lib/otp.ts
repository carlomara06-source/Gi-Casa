// Phone OTP via Twilio Verify (test/sandbox mode) with a dev-mode fallback.
//
// Real mode: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and
// TWILIO_VERIFY_SERVICE_SID (see .env.example) — this calls the real Twilio
// Verify API against a Verify Service in test mode, so no SMS is actually
// billed until you switch to production credentials.
//
// Dev fallback: without those env vars, a 6-digit code is generated locally,
// stored on the OtpVerification row, and logged server-side instead of sent
// by SMS — so the flow works end-to-end in this sandbox without a Twilio
// account. The OTP still doubles as the Foglio di Visita / FEA signature
// record either way.

import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import type { OtpPurpose } from "@/generated/prisma/enums";

const OTP_TTL_MINUTES = 10;

function twilioConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID,
  );
}

function twilioClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return `+${digits}`;
  return `+39${digits}`;
}

export async function sendOtp(phoneRaw: string, purpose: OtpPurpose) {
  const phone = toE164(phoneRaw);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  if (twilioConfigured()) {
    const verification = await twilioClient()
      .verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({ to: phone, channel: "sms" });

    const record = await prisma.otpVerification.create({
      data: { phone, purpose, twilioSid: verification.sid, expiresAt },
    });
    return { id: record.id, mode: "twilio" as const };
  }

  const devCode = String(Math.floor(100000 + Math.random() * 900000));
  const record = await prisma.otpVerification.create({
    data: { phone, purpose, devCode, expiresAt },
  });
  console.log(`[otp:dev] code for ${phone} (${purpose}): ${devCode}`);
  return { id: record.id, mode: "dev" as const, devCode };
}

export async function verifyOtp(otpId: string, code: string) {
  const record = await prisma.otpVerification.findUnique({ where: { id: otpId } });
  if (!record || record.status !== "PENDING") return { ok: false as const, reason: "not_found" };
  if (record.expiresAt < new Date()) {
    await prisma.otpVerification.update({ where: { id: otpId }, data: { status: "EXPIRED" } });
    return { ok: false as const, reason: "expired" };
  }

  let ok = false;
  if (record.twilioSid) {
    const check = await twilioClient()
      .verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to: record.phone, code });
    ok = check.status === "approved";
  } else {
    ok = record.devCode === code;
  }

  if (!ok) return { ok: false as const, reason: "invalid" };

  await prisma.otpVerification.update({
    where: { id: otpId },
    data: { status: "APPROVED", consumedAt: new Date() },
  });
  return { ok: true as const, phone: record.phone };
}
