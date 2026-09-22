"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";

export function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/menu";

  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState("");
  const [otpId, setOtpId] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = phone.replace(/\D/g, "").length >= 9 && consent;

  async function sendCode() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, purpose: "LOGIN" }),
    });
    const data = await res.json();
    setOtpId(data.otpId);
    setDevHint(data.mode === "dev" ? `Demo: il codice è ${data.devCode}` : null);
    setStage("code");
    setBusy(false);
  }

  async function verify() {
    if (!otpId) return;
    setBusy(true);
    setError(null);
    const result = await signIn("otp", { otpId, code, redirect: false });
    setBusy(false);
    if (result?.error) {
      setError("Codice non valido. Controlla e riprova.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-bg pt-[54px]">
      <TopBar />
      <div className="px-4 pt-6">
        {stage === "phone" ? (
          <>
            <h2 className="mb-2.5 font-display text-[30px] leading-[1.12] tracking-[-0.018em]">Accedi a Giàcasa</h2>
            <p className="mb-5 text-[13.5px] leading-relaxed text-neutral-700">
              Ti mandiamo un codice via SMS. Nessuna password: il numero è anche la tua identità
              per firme e visite.
            </p>
            <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
              NUMERO DI TELEFONO
            </div>
            <div className="blueprint mb-4 flex items-center bg-surface">
              <div className="border-r border-divider px-3 font-display text-xl text-neutral-700">+39</div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9 ]/g, "").slice(0, 13))}
                placeholder="333 000 0000"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 font-display text-2xl outline-none"
              />
            </div>
            <div onClick={() => setConsent((c) => !c)} className="mb-5 flex cursor-pointer items-start gap-2.5">
              <div className={`mt-0.5 h-4.5 w-4.5 flex-none border-[1.5px] ${consent ? "border-accent-600 bg-accent-600" : "border-neutral-400"}`} />
              <div className="text-xs leading-snug text-neutral-700">Ho letto l&apos;informativa privacy.</div>
            </div>
            <Button className="w-full" disabled={!canSend || busy} onClick={sendCode}>
              {busy ? "Invio…" : "Invia codice SMS"}
            </Button>
          </>
        ) : (
          <>
            <h2 className="mb-2.5 font-display text-[30px] leading-[1.12] tracking-[-0.018em]">Inserisci il codice</h2>
            <p className="mb-4 text-[13.5px] leading-snug text-neutral-700">Sei cifre inviate al +39 {phone}.</p>
            {devHint && <p className="mb-3 text-xs font-semibold text-blue-700">{devHint}</p>}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="······"
              className="blueprint mb-4 w-full bg-surface px-3 py-3 text-center font-display text-2xl tracking-[0.4em] outline-none"
            />
            {error && <div className="mb-3 text-xs text-accent-700">{error}</div>}
            <Button className="w-full" disabled={code.length !== 6 || busy} onClick={verify}>
              {busy ? "Verifico…" : "Accedi"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
