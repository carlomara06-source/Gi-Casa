"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { eur, feeFor, agencyFor, tierFor } from "@/lib/pricing";

const CAPARRE = [5, 10, 15];
const VALIDITIES = ["3 giorni", "7 giorni", "15 giorni"];
const CONDITIONS = [
  { id: "mutuo", label: "Sospensiva per mutuo", note: "Se la banca dice no, la proposta decade e la caparra torna a te." },
  { id: "agibilita", label: "Conformità catastale e agibilità", note: "Verificate da noi prima del preliminare." },
  { id: "arredi", label: "Cucina e arredi inclusi", note: "Da concordare con il venditore." },
];
const AML_STEPS = [
  { id: "id", label: "Documento d'identità", note: "Carta d'identità o passaporto" },
  { id: "cf", label: "Codice fiscale", note: "Tessera sanitaria" },
  { id: "fondi", label: "Origine dei fondi", note: "Autocertificazione, obbligatoria per legge" },
];

function pill(active: boolean) {
  return `cursor-pointer select-none border px-3 py-2 font-body text-[12.5px] font-medium ${
    active ? "border-blue-600 bg-blue-600 text-white" : "border-divider bg-transparent text-neutral-800"
  }`;
}

export function ProposalClient({
  listingId,
  addressLine,
  requestedPrice,
  requestedPriceLabel,
  marketValueLabel,
  min,
  max,
}: {
  listingId: string;
  addressLine: string;
  requestedPrice: number;
  requestedPriceLabel: string;
  marketValueLabel: string;
  min: number;
  max: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "sign" | "done">("form");
  const [offer, setOffer] = useState(requestedPrice);
  const [caparraPct, setCaparraPct] = useState(10);
  const [validDays, setValidDays] = useState(7);
  const [conditions, setConditions] = useState<string[]>(["mutuo", "agibilita"]);
  const [amlDone, setAmlDone] = useState<string[]>(["id"]);
  const [otpId, setOtpId] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [signRead, setSignRead] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneAmount, setDoneAmount] = useState(0);

  const diff = offer - requestedPrice;
  const caparra = Math.round(((offer * caparraPct) / 100 / 500)) * 500;
  const amlOk = ["id", "cf", "fondi"].every((k) => amlDone.includes(k));
  const canSign = amlOk && code.length === 6 && signRead;

  async function goSign() {
    setStep("sign");
    setBusy(true);
    try {
      const res = await fetch("/api/otp/send-for-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "FEA_SIGNATURE" }),
      });
      const data = await res.json();
      setOtpId(data.otpId);
      setDevHint(data.mode === "dev" ? `Demo: il codice è ${data.devCode}` : null);
    } finally {
      setBusy(false);
    }
  }

  async function doSign() {
    if (!canSign || !otpId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          amount: offer,
          depositPct: caparraPct,
          validDays,
          conditions,
          amlIdDone: amlDone.includes("id"),
          amlCfDone: amlDone.includes("cf"),
          amlFundsDone: amlDone.includes("fondi"),
          otpId,
          code,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error === "otp_invalid" ? "Codice non valido." : "Non siamo riusciti a inviare la proposta.");
        setBusy(false);
        return;
      }
      setDoneAmount(offer);
      setStep("done");
    } catch {
      setError("Qualcosa è andato storto. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg pt-[54px] pb-10">
      <TopBar
        right={
          <span className="font-label text-[10px] font-semibold tracking-[0.12em] text-neutral-600">
            {step === "form" ? "PROPOSTA · 1 DI 2" : step === "sign" ? "FIRMA FEA · 2 DI 2" : "INVIATA"}
          </span>
        }
      />

      {step === "form" && (
        <>
          <div className="px-4 pt-4">
            <h2 className="mb-2 font-display text-[30px] leading-[1.1] tracking-[-0.018em]">La tua proposta</h2>
            <p className="mb-4.5 text-[13px] leading-snug text-neutral-700">
              Una volta firmata è vincolante per te fino alla scadenza che indichi. Il venditore può
              accettarla, rifiutarla o farti una controproposta.
            </p>

            <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
              PREZZO CHE OFFRI
            </div>
            <div className="font-display text-[44px] leading-none">{eur(offer)}</div>
            <input
              type="range"
              min={min}
              max={max}
              step={500}
              value={offer}
              onChange={(e) => setOffer(Number(e.target.value))}
              className="my-3.5 w-full"
            />
            <div className="mb-2.5 flex items-center justify-between gap-2.5 font-label text-[9.5px] font-semibold tracking-[0.09em] text-neutral-600">
              <span>RICHIESTA {requestedPriceLabel}</span>
              <span>STIMA DI MERCATO {marketValueLabel}</span>
            </div>
            <div
              className={`inline-block px-2 py-1.75 font-label text-[10px] font-semibold tracking-[0.1em] ${
                diff === 0 ? "bg-blue-200 text-blue-800" : diff > 0 ? "bg-accent-200 text-accent-700" : "bg-sun-200 text-sun-700"
              }`}
            >
              {diff === 0 ? "IN LINEA CON LA STIMA DI MERCATO" : diff > 0 ? `SOPRA LA STIMA DI ${eur(diff)}` : `SOTTO LA STIMA DI ${eur(-diff)}`}
            </div>
            <div className="mt-2.5 text-[12.5px] leading-snug text-neutral-700">
              {diff > 0
                ? "Stai offrendo più della stima: ha senso solo se la casa ti interessa davvero o se ci sono altre proposte."
                : diff < -12000
                  ? "Offerta bassa: il venditore probabilmente controproporrà. Alza la caparra per rendere la proposta più credibile."
                  : "Offerta plausibile: in zona si chiude in media al 2,5% sotto il prezzo richiesto."}
            </div>
          </div>

          <div className="px-4 pt-5.5">
            <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
              CAPARRA CONFIRMATORIA
            </div>
            <div className="mb-2.5 flex flex-wrap gap-1.75">
              {CAPARRE.map((p) => (
                <div key={p} onClick={() => setCaparraPct(p)} className={pill(caparraPct === p)}>
                  {p}% · {eur(Math.round(((offer * p) / 100 / 500)) * 500)}
                </div>
              ))}
            </div>
            <div className="border border-divider bg-surface p-3.25">
              <div className="flex items-baseline justify-between gap-2.5">
                <div className="text-[12.5px] text-neutral-700">Versi ora, su conto vincolato</div>
                <div className="flex-none font-display text-2xl">{eur(caparra)}</div>
              </div>
              <div className="mt-2.25 text-[11.5px] leading-snug text-neutral-700">
                Non la incassa nessuno finché la proposta non viene accettata. Se il venditore
                rifiuta o lascia scadere, ti torna intera. Se accetta e poi sei tu a ritirarti, la
                perdi; se si ritira lui, ti deve il doppio.
              </div>
            </div>
          </div>

          <div className="px-4 pt-5.5">
            <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
              VALIDITÀ DELLA PROPOSTA
            </div>
            <div className="mb-4.5 flex flex-wrap gap-1.75">
              {VALIDITIES.map((v, i) => {
                const days = [3, 7, 15][i];
                return (
                  <div key={v} onClick={() => setValidDays(days)} className={pill(validDays === days)}>
                    {v}
                  </div>
                );
              })}
            </div>

            <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">CONDIZIONI</div>
            <div className="mb-5 flex flex-col gap-2.25">
              {CONDITIONS.map((c) => (
                <div
                  key={c.id}
                  onClick={() =>
                    setConditions((prev) => (prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]))
                  }
                  className="flex cursor-pointer items-start gap-2.5"
                >
                  <div
                    className={`mt-0.5 h-4.5 w-4.5 flex-none border-[1.5px] ${
                      conditions.includes(c.id) ? "border-blue-600 bg-blue-600" : "border-neutral-400"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] leading-snug">{c.label}</div>
                    <div className="mt-0.75 text-[11px] text-neutral-600">{c.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4">
            <div className="border border-divider bg-surface">
              <div className="bg-blue-100 px-3 py-2.5 font-label text-[9px] font-semibold tracking-[0.11em] text-blue-700">
                RIEPILOGO ECONOMICO
              </div>
              {[
                { k: "Prezzo offerto", note: "vincolante se accettato", v: eur(offer) },
                { k: "Caparra confirmatoria", note: `${caparraPct}% su conto vincolato`, v: eur(caparra) },
                { k: "Saldo al rogito", note: "prezzo meno caparra", v: eur(offer - caparra) },
                {
                  k: "Nostra tariffa fissa",
                  note: `scaglione ${tierFor(offer).range.toLowerCase()}, dovuta solo a proposta accettata`,
                  v: eur(feeFor(offer)),
                  accent: true,
                },
                { k: "Con un'agenzia tradizionale", note: "3% + IVA a tuo carico", v: eur(agencyFor(offer)), strike: true },
              ].map((r) => (
                <div key={r.k} className="flex items-baseline justify-between gap-3 border-t border-divider px-3 py-2.75">
                  <div className="min-w-0">
                    <div className="text-[12.5px] leading-tight">{r.k}</div>
                    <div className="mt-0.5 text-[10.5px] text-neutral-600">{r.note}</div>
                  </div>
                  <div
                    className={`flex-none font-display text-[19px] ${r.accent ? "text-accent-700" : ""} ${r.strike ? "text-neutral-600 line-through" : ""}`}
                  >
                    {r.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-8" />
          <div className="px-4">
            <Button className="w-full" onClick={goSign}>Vai alla firma</Button>
            <div className="mt-2.5 text-center font-label text-[9.5px] font-semibold tracking-[0.1em] text-neutral-600">
              NIENTE È VINCOLANTE FINCHÉ NON FIRMI
            </div>
          </div>
        </>
      )}

      {step === "sign" && (
        <div className="px-4 pt-4">
          <h2 className="mb-2 font-display text-[30px] leading-[1.1] tracking-[-0.018em]">Firma elettronica avanzata</h2>
          <p className="mb-4 text-[13px] leading-snug text-neutral-700">
            La FEA rende la proposta vincolante come una firma davanti al notaio. Identità, orario e
            documento restano tracciati.
          </p>

          <div className="mb-4 border border-divider bg-surface p-3.5">
            <div className="mb-2.5 font-label text-[9px] font-semibold tracking-[0.11em] text-neutral-600">
              STAI FIRMANDO
            </div>
            <div className="flex items-baseline justify-between gap-2.5">
              <div className="font-display text-[30px] leading-none">{eur(offer)}</div>
              <div className="flex-none font-label text-[10px] font-semibold tracking-[0.09em] text-neutral-600">
                {addressLine}
              </div>
            </div>
            <div className="mt-2.25 text-xs leading-snug text-neutral-700">
              Caparra {eur(caparra)} · valida {VALIDITIES[[3, 7, 15].indexOf(validDays)]} ·{" "}
              {conditions.length ? `${conditions.length} condizioni sospensive` : "nessuna condizione"}
            </div>
          </div>

          <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
            VERIFICA ANTIRICICLAGGIO (AML)
          </div>
          <div className="mb-4.5 flex flex-col gap-2.25">
            {AML_STEPS.map((a) => {
              const ok = amlDone.includes(a.id);
              return (
                <div
                  key={a.id}
                  onClick={() => setAmlDone((prev) => (prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]))}
                  className={`flex cursor-pointer items-center gap-2.75 border p-3 ${ok ? "border-blue-600 bg-blue-100" : "border-divider bg-surface"}`}
                >
                  <div className={`h-4.5 w-4.5 flex-none border-[1.5px] ${ok ? "border-blue-600 bg-blue-600" : "border-neutral-400"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px]">{a.label}</div>
                    <div className="mt-0.75 text-[11px] text-neutral-600">{a.note}</div>
                  </div>
                  <div className={`flex-none font-label text-[9.5px] font-semibold tracking-[0.1em] ${ok ? "text-blue-700" : "bg-accent-600 px-1.5 py-1.25 text-white"}`}>
                    {ok ? "OK" : "CARICA"}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
            CODICE OTP DEL PROVIDER
          </div>
          {devHint && <p className="mb-2 text-xs font-semibold text-blue-700">{devHint}</p>}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="······"
            className="blueprint mb-4 w-full bg-surface px-3 py-3 text-center font-display text-2xl tracking-[0.4em] outline-none"
          />

          <div onClick={() => setSignRead((r) => !r)} className="mb-5 flex cursor-pointer items-start gap-2.5">
            <div className={`mt-0.5 h-4.5 w-4.5 flex-none border-[1.5px] ${signRead ? "border-blue-600 bg-blue-600" : "border-neutral-400"}`} />
            <div className="text-xs leading-snug text-neutral-700">
              Ho letto la proposta e so che, se accettata, sono obbligato all&apos;acquisto e la
              caparra è vincolata.
            </div>
          </div>

          {error && <div className="mb-3 text-xs text-accent-700">{error}</div>}

          <Button className="w-full" disabled={!canSign || busy} onClick={doSign}>
            {busy ? "Un attimo…" : !amlOk ? "Completa la verifica AML" : code.length < 6 ? "Inserisci il codice OTP" : "Firma con FEA e invia"}
          </Button>
          <button onClick={() => setStep("form")} className="mt-2.75 block w-full text-center text-[12.5px] text-blue-700 underline underline-offset-3">
            torna a modificare la proposta
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="px-4 pt-9 text-center">
          <div className="mx-auto mb-4.5 flex h-14 w-14 items-center justify-center bg-accent-600">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
              <path d="M5 12.5 10 17.5 19.5 7" />
            </svg>
          </div>
          <h2 className="mb-2.5 font-display text-[30px] leading-[1.12]">Proposta firmata e inviata</h2>
          <p className="mb-5.5 text-[13px] leading-relaxed text-neutral-700">
            Il venditore ha {VALIDITIES[[3, 7, 15].indexOf(validDays)]} per accettare, rifiutare o
            controproporre. La caparra resta bloccata e non incassata fino alla sua risposta.
          </p>
          <div className="border border-divider bg-surface text-left">
            {[
              { k: "Prezzo offerto", v: eur(doneAmount) },
              { k: "Caparra vincolata", v: eur(caparra) },
              { k: "Tariffa dovuta se accettata", v: eur(feeFor(doneAmount)) },
            ].map((r) => (
              <div key={r.k} className="flex items-baseline justify-between gap-3 border-b border-divider p-3 last:border-0">
                <span className="text-[12.5px] text-neutral-700">{r.k}</span>
                <span className="font-display text-xl">{r.v}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push(`/annunci/${listingId}`)}
            className="mt-4.5 text-[12.5px] text-blue-700 underline underline-offset-3"
          >
            torna all&apos;annuncio
          </button>
        </div>
      )}
    </div>
  );
}
