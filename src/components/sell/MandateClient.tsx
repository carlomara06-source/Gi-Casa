"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";

const PACT = [
  { n: "1", t: "Un solo canale, un solo prezzo", d: "Con l'esclusiva l'immobile ha una storia sola: nessun annuncio doppio a prezzi diversi, che è la prima cosa che svaluta una casa." },
  { n: "2", t: "Il mandato non ti costa niente", d: "Zero provvigioni sul prezzo di vendita. Firmarlo non attiva nessun addebito: paghi solo i servizi settimanali che scegli tu." },
  { n: "3", t: "Sei mesi, con uscita libera", d: "Durata 6 mesi. Dopo i primi 30 giorni puoi recedere dal gestionale in un tocco, senza penali né preavviso." },
  { n: "4", t: "In cambio ci obblighiamo noi", d: "Agente abilitato di zona, controllo della documentazione, diffusione sui grandi portali, gestione di visite e proposte fino al rogito." },
  { n: "5", t: "I documenti li custodiamo", d: "Planimetrie e visure si sbloccano solo a chi firma il Foglio di Visita con OTP. Il tuo numero non lo vede nessuno." },
];

const NEVER = [
  "Il prezzo: lo decidi e lo cambi tu, quando vuoi",
  "La provvigione: 0% a tuo carico, in ogni piano",
  "Le proposte: accetti o rifiuti solo tu, in app",
  "Se l'acquirente lo trovi tu, la tariffa fissa la paga lui",
  "I servizi settimanali: attivi, in pausa o disdetti in 1 clic",
];

const LEGAL_TEXT =
  "Art. 1 — Oggetto. Il proprietario conferisce a Giàcasa incarico di mediazione per la vendita dell'immobile, con pubblicazione sulla piattaforma, diffusione sui portali convenzionati e assistenza di un agente immobiliare abilitato operante in zona. Art. 2 — Esclusiva e durata. L'incarico è conferito in esclusiva per 6 mesi dalla sottoscrizione. Art. 3 — Recesso. Trascorsi i primi 30 giorni, il proprietario può recedere in qualsiasi momento dal gestionale, senza penali né obbligo di preavviso. Art. 4 — Corrispettivi. Nessuna provvigione è dovuta dal proprietario, né in caso di vendita né in caso di recesso. Art. 5 — Tariffa acquirente. La tariffa fissa a scaglioni è dovuta dalla parte acquirente, a visita confermata e proposta accettata. Art. 6 — Documenti e dati. Planimetrie e visure sono rese visibili unicamente a chi sottoscrive il Foglio di Visita con OTP.";

export function MandateClient({
  listingId,
  addressLine,
  alreadySigned,
  signedAtLabel,
  expiresAtLabel,
}: {
  listingId: string;
  addressLine: string;
  alreadySigned: boolean;
  signedAtLabel: string | null;
  expiresAtLabel: string | null;
}) {
  const router = useRouter();
  const [pactRead, setPactRead] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [hold, setHold] = useState(0);
  const [stage, setStage] = useState<"pact" | "otp" | "done">(alreadySigned ? "done" : "pact");
  const [otpId, setOtpId] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  // React (Strict Mode) may invoke a setState updater function more than
  // once per tick to check purity, so the "reached 100%" side effect can't
  // live inside setHold's updater — this ref makes it fire exactly once.
  const otpStarted = useRef(false);

  function holdStart() {
    if (!pactRead || stage !== "pact") return;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setHold((h) => Math.min(100, h + 7));
    }, 45);
  }

  function holdEnd() {
    if (timer.current) clearInterval(timer.current);
    if (stage === "pact") setHold(0);
  }

  async function startOtp() {
    setStage("otp");
    setBusy(true);
    const res = await fetch("/api/otp/send-for-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "FEA_SIGNATURE" }),
    });
    const data = await res.json();
    setOtpId(data.otpId);
    setDevHint(data.mode === "dev" ? `Demo: il codice è ${data.devCode}` : null);
    setBusy(false);
  }

  useEffect(() => {
    if (hold >= 100 && !otpStarted.current) {
      otpStarted.current = true;
      if (timer.current) clearInterval(timer.current);
      startOtp();
    }
  }, [hold]);

  async function confirmSign() {
    if (!otpId || code.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}/mandate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otpId, code }),
      });
      if (!res.ok) throw new Error();
      setStage("done");
      router.refresh();
    } catch {
      setError("Codice non valido o mandato già firmato.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg pt-[54px]">
      <TopBar right={<span className="font-label text-[10px] font-semibold tracking-[0.12em] text-neutral-600">{addressLine.toUpperCase()}</span>} />

      {stage === "pact" && (
        <>
          <div className="px-4 pt-4.5">
            <div className="mb-3 font-label text-[10px] font-semibold tracking-[0.16em] text-accent-700">
              MANDATO IN ESCLUSIVA · 5 PUNTI, 2 MINUTI
            </div>
            <h2 className="mb-2.5 font-display text-[31px] leading-[1.1] tracking-[-0.018em]">
              Sì, è un&apos;esclusiva.
              <br />
              <em className="font-normal text-accent-700 italic">Ma qui gli obblighi sono nostri.</em>
            </h2>
            <p className="mb-5 text-[13.5px] leading-relaxed text-neutral-700">
              Siamo un&apos;agenzia ibrida: la velocità di un portale e le tutele di un&apos;agenzia.
              L&apos;esclusiva serve a questo — un solo prezzo, una sola storia, un agente abilitato
              che risponde di persona. A te costa 0%.
            </p>

            <div className="mb-5 grid grid-cols-2 gap-px border border-divider bg-divider">
              <div className="bg-bg p-2.75">
                <div className="mb-1.5 font-label text-[8.5px] font-semibold tracking-[0.1em] text-neutral-600">DAL PORTALE</div>
                <div className="text-xs leading-snug">Pubblichi tu in 4 minuti, statistiche in tempo reale, chat diretta, servizi a settimana.</div>
              </div>
              <div className="bg-bg p-2.75">
                <div className="mb-1.5 font-label text-[8.5px] font-semibold tracking-[0.1em] text-neutral-600">DALL&apos;AGENZIA</div>
                <div className="text-xs leading-snug">Mandato, agente abilitato di zona, verifiche catastali, proposte vincolanti e assistenza al rogito.</div>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              {PACT.map((p) => (
                <div key={p.n} className="flex items-start gap-3.5">
                  <div className="w-8.5 flex-none font-display text-[34px] leading-[0.85] text-blue-400">{p.n}</div>
                  <div className="min-w-0">
                    <div className="font-heading text-lg leading-tight font-semibold">{p.t}</div>
                    <div className="mt-1 text-[12.5px] leading-snug text-neutral-700">{p.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 pt-6">
            <div className="border border-divider p-3.75">
              <div className="mb-2.75 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
                COSA RESTA TUO, ANCHE CON L&apos;ESCLUSIVA
              </div>
              <div className="flex flex-col gap-2.25">
                {NEVER.map((n) => (
                  <div key={n} className="flex items-center gap-2.25">
                    <div className="h-px w-2.75 flex-none bg-neutral-400" />
                    <div className="text-[12.5px] text-neutral-800">{n}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 pt-5.5 pb-10">
            <div onClick={() => setPactRead((r) => !r)} className="mb-4 flex cursor-pointer items-start gap-2.5">
              <div className={`mt-0.5 h-4.5 w-4.5 flex-none border-[1.5px] ${pactRead ? "border-accent-600 bg-accent-600" : "border-neutral-400"}`} />
              <div className="text-[12.5px] leading-snug text-neutral-700">
                Ho letto i 5 punti: mandato in esclusiva di 6 mesi, provvigione 0% a mio carico,
                recesso libero dopo i primi 30 giorni.
              </div>
            </div>
            <div
              onMouseDown={holdStart}
              onMouseUp={holdEnd}
              onMouseLeave={holdEnd}
              onTouchStart={holdStart}
              onTouchEnd={holdEnd}
              className={`relative flex select-none items-center justify-center overflow-hidden p-4.25 ${
                pactRead ? "cursor-pointer bg-accent-900 text-white" : "cursor-default bg-neutral-200 text-neutral-500"
              }`}
            >
              <div className="absolute inset-y-0 left-0 bg-accent-600 transition-[width] duration-75" style={{ width: `${hold}%` }} />
              <div className="relative font-heading text-[17px] font-semibold tracking-[0.05em] uppercase">
                {pactRead ? (hold > 0 ? "Tieni premuto…" : "Tieni premuto per firmare") : "Prima conferma la lettura"}
              </div>
            </div>
            <div className="mt-3 text-center font-label text-[9.5px] leading-relaxed font-semibold tracking-[0.08em] text-neutral-600">
              FIRMA ELETTRONICA AVANZATA (FEA) TRAMITE OTP. RICEVI COPIA PDF VIA EMAIL.
            </div>
            <button onClick={() => setLegalOpen((v) => !v)} className="mt-3.5 block w-full text-center text-[12.5px] text-accent-700 underline underline-offset-3">
              {legalOpen ? "chiudi il testo integrale" : "leggi il testo integrale"}
            </button>
            {legalOpen && (
              <div className="mt-3 border border-divider p-3 text-[11.5px] leading-relaxed text-neutral-600">{LEGAL_TEXT}</div>
            )}
          </div>
        </>
      )}

      {stage === "otp" && (
        <div className="px-4 pt-6">
          <h2 className="mb-2.5 font-display text-2xl">Conferma con il codice OTP</h2>
          <p className="mb-4 text-[13px] leading-snug text-neutral-700">
            Il codice che ricevi via SMS firma il mandato con valore di Firma Elettronica Avanzata.
          </p>
          {devHint && <p className="mb-3 text-xs font-semibold text-blue-700">{devHint}</p>}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="······"
            className="blueprint mb-4 w-full bg-surface px-3 py-3 text-center font-display text-2xl tracking-[0.4em] outline-none"
          />
          {error && <div className="mb-3 text-xs text-accent-700">{error}</div>}
          <Button className="w-full" disabled={code.length !== 6 || busy} onClick={confirmSign}>
            {busy ? "Firmo…" : "Firma il mandato"}
          </Button>
        </div>
      )}

      {stage === "done" && (
        <div className="px-4 pt-10 text-center">
          <div className="mx-auto mb-5 flex h-15 w-15 items-center justify-center bg-accent-600">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
              <path d="M5 12.5 10 17.5 19.5 7" />
            </svg>
          </div>
          <h2 className="mb-3 font-display text-[30px] leading-[1.12]">Mandato attivo</h2>
          <p className="mb-6 text-[13.5px] leading-relaxed text-neutral-700">
            {signedAtLabel
              ? `Mandato in esclusiva firmato con FEA il ${signedAtLabel}.`
              : "Mandato in esclusiva firmato con FEA."}{" "}
            L&apos;annuncio è ora online.
          </p>
          <div className="blueprint bg-surface p-4 text-left">
            <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
              {signedAtLabel && expiresAtLabel
                ? `MANDATO ${signedAtLabel} – ${expiresAtLabel}`
                : "MANDATO ATTIVO"}
            </div>
            <div className="text-[12.5px] leading-relaxed text-neutral-800">
              Dopo i primi 30 giorni puoi recedere dal gestionale, con una conferma. Nessuna penale,
              la provvigione a tuo carico resta 0% in ogni caso.
            </div>
          </div>
          <a href="/venditore" className="mt-5 block bg-accent-900 py-3.5 text-center font-heading text-sm font-semibold tracking-[0.05em] text-white uppercase hover:bg-blue-800">
            Vai alla dashboard
          </a>
        </div>
      )}
    </div>
  );
}
