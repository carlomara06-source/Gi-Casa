// Advanced electronic signature (FEA) record. There's no named certified FEA
// provider in the spec, so a real OTP verification (src/lib/otp.ts) stands in
// for identity proof, and this produces the tamper-evident hash that a real
// provider integration (Namirial, InfoCert, Yousign…) would return — swap
// `signPayload` for a real provider call without touching the callers.

import { createHash } from "node:crypto";

export function signPayload(payload: Record<string, unknown>, otpId: string): string {
  const json = JSON.stringify({ ...payload, otpId, signedAt: new Date().toISOString() });
  return createHash("sha256").update(json).digest("hex");
}
