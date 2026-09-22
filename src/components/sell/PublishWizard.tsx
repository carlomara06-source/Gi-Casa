"use client";

import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Placeholder } from "@/components/ui/Placeholder";
import { Button } from "@/components/ui/Button";
import { eur, feeFor, agencyFor, tierFor } from "@/lib/pricing";

const TIPI = [
  { id: "APPARTAMENTO", label: "Appartamento" },
  { id: "VILLA", label: "Villa" },
  { id: "ATTICO", label: "Attico" },
  { id: "RUSTICO", label: "Rustico" },
] as const;

const PORTALS = [
  { id: "IMMOBILIARE", name: "Immobiliare.it" },
  { id: "IDEALISTA", name: "Idealista" },
  { id: "CASA_IT", name: "Casa.it" },
] as const;

function chip(active: boolean) {
  return `cursor-pointer select-none border px-3 py-2 font-body text-[12.5px] font-medium ${
    active ? "border-blue-600 bg-blue-600 text-white" : "border-divider bg-transparent text-neutral-800"
  }`;
}

export function PublishWizard() {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zone, setZone] = useState("");
  const [tipo, setTipo] = useState<(typeof TIPI)[number]["id"]>("APPARTAMENTO");
  const [mq, setMq] = useState("70");
  const [locali, setLocali] = useState("3");
  const [price, setPrice] = useState(189000);
  const [portals, setPortals] = useState<string[]>(["IMMOBILIARE", "IDEALISTA", "CASA_IT"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);

  const mqN = Number(mq) || 1;
  const canStep1 = address.trim().length > 2 && city.trim().length > 0 && zone.trim().length > 0 && mqN > 0;

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressLine: address,
          city,
          zone,
          type: tipo,
          mq: mqN,
          locali: Number(locali) || 1,
          price,
          portals,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setListingId(data.listing.id);
      setStep(4);
    } catch {
      setError("Non siamo riusciti a pubblicare l'annuncio. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg pt-[54px]">
      <TopBar
        right={
          step <= 3 ? (
            <span className="font-label text-[10px] font-semibold tracking-[0.14em] text-neutral-600">
              PASSO 0{step} / 03
            </span>
          ) : (
            <span className="font-label text-[10px] font-semibold tracking-[0.14em] text-neutral-600">FATTO</span>
          )
        }
      />
      <div className="grid grid-cols-3 gap-0.75 px-4 pt-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1 rounded ${step >= i ? "bg-accent-600" : "bg-divider"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="px-4 pt-5">
          <h2 className="mb-2 font-display text-[29px] leading-[1.12] tracking-[-0.018em]">Dov&apos;è la tua casa?</h2>
          <p className="mb-5 text-[13px] text-neutral-700">
            Mandato in esclusiva firmato in app, provvigione 0% a tuo carico. Recesso libero dopo i
            primi 30 giorni.
          </p>

          <div className="mb-1.75 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">INDIRIZZO</div>
          <div className="blueprint mb-5 bg-surface">
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Via, civico" className="w-full bg-transparent px-3 py-3.25 font-body text-[15px] outline-none" />
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1.75 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">CITTÀ</div>
              <div className="blueprint bg-surface">
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Milano" className="w-full bg-transparent px-3 py-3 font-body text-[15px] outline-none" />
              </div>
            </div>
            <div>
              <div className="mb-1.75 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">ZONA</div>
              <div className="blueprint bg-surface">
                <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Isola" className="w-full bg-transparent px-3 py-3 font-body text-[15px] outline-none" />
              </div>
            </div>
          </div>

          <div className="mb-1.75 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">TIPOLOGIA</div>
          <div className="mb-5 flex flex-wrap gap-1.75">
            {TIPI.map((t) => (
              <div key={t.id} onClick={() => setTipo(t.id)} className={chip(tipo === t.id)}>
                {t.label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1.75 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">METRI QUADRI</div>
              <div className="blueprint bg-surface">
                <input value={mq} onChange={(e) => setMq(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} className="w-full bg-transparent px-3 py-2 font-display text-2xl outline-none" />
              </div>
            </div>
            <div>
              <div className="mb-1.75 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">LOCALI</div>
              <div className="blueprint bg-surface">
                <input value={locali} onChange={(e) => setLocali(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))} className="w-full bg-transparent px-3 py-2 font-display text-2xl outline-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="px-4 pt-5">
          <h2 className="mb-2 font-display text-[29px] leading-[1.12] tracking-[-0.018em]">A quanto la metti?</h2>
          <p className="mb-4.5 text-[13px] text-neutral-700">Il prezzo è tuo. Quello che cambia è chi paga il servizio, e quanto.</p>
          <div className="mb-1 font-display text-[52px] leading-[0.9] tracking-[-0.02em]">{eur(price)}</div>
          <div className="mb-3.5 text-xs text-neutral-600">
            {Math.round(price / mqN).toLocaleString("it-IT")} €/m² · {tipo.toLowerCase()}, {mq} m²
          </div>
          <input type="range" min={50000} max={900000} step={5000} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="mb-5.5 w-full" />

          <div className="blueprint mb-3.5 bg-accent-900 p-4 text-white">
            <div className="mb-2.5 font-label text-[9.5px] font-semibold tracking-[0.14em] opacity-70">CON UN&apos;AGENZIA TRADIZIONALE</div>
            <div className="flex items-end justify-between gap-3.5">
              <div>
                <div className="font-display text-4xl leading-[0.9] line-through decoration-[1.5px]">{eur(agencyFor(price))}</div>
                <div className="mt-1 text-[11.5px] opacity-75">3% + IVA a carico tuo</div>
              </div>
              <div className="text-right">
                <div className="font-display text-4xl leading-[0.9] text-sun">0 €</div>
                <div className="mt-1 text-[11.5px] opacity-75">con Giàcasa</div>
              </div>
            </div>
          </div>
          <div className="blueprint bg-surface p-3.5">
            <div className="mb-1.5 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">L&apos;ACQUIRENTE PAGHERÀ</div>
            <div className="flex items-baseline gap-2.5">
              <div className="font-display text-[32px] leading-none text-accent-700">{eur(feeFor(price))}</div>
              <div className="text-xs text-neutral-700">scaglione {tierFor(price).range.toLowerCase()}</div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="px-4 pt-5">
          <h2 className="mb-2 font-display text-[29px] leading-[1.12] tracking-[-0.018em]">Foto e diffusione</h2>
          <p className="mb-4 text-[13px] text-neutral-700">Le prime tre foto finiscono anche sui portali esterni.</p>
          <div className="mb-5 grid grid-cols-2 grid-rows-[132px_92px] gap-2">
            <Placeholder label="foto principale · soggiorno" className="col-span-2" />
            <Placeholder label="cucina" />
            <Placeholder label="camera" />
          </div>

          <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
            DIFFUSIONE SUI PORTALI
          </div>
          <div className="mb-3 flex flex-col gap-2">
            {PORTALS.map((p) => {
              const on = portals.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => setPortals((prev) => (prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]))}
                  className={`flex cursor-pointer items-center gap-2.75 border p-3 ${on ? "border-accent-600 bg-accent-100" : "border-divider"}`}
                >
                  <div className={`h-4.5 w-4.5 flex-none border-[1.5px] ${on ? "border-accent-600 bg-accent-600" : "border-neutral-400"}`} />
                  <div className="font-heading text-sm font-semibold">{p.name}</div>
                </div>
              );
            })}
          </div>
          <div className="mb-4 border border-accent-600 bg-accent-100 p-3.25">
            <div className="mb-1.5 font-label text-[9.5px] font-semibold tracking-[0.12em] text-accent-800">SE ATTIVI UN PIANO</div>
            <div className="text-[12.5px] leading-snug text-neutral-800">
              Togliamo il nostro banner promozionale dall&apos;annuncio esterno e ti spingiamo in
              evidenza: sui portali resta solo la tua casa.
            </div>
          </div>
          <div className="font-label text-[10px] leading-relaxed font-semibold text-neutral-600">
            I CONTATTI ARRIVANO SEMPRE IN CHAT ANONIMA: IL TUO NUMERO NON FINISCE SUI PORTALI.
          </div>
        </div>
      )}

      {step === 4 && listingId && (
        <div className="px-4 pt-8 text-center">
          <div className="mx-auto mb-4.5 flex h-14 w-14 items-center justify-center bg-accent-600">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
              <path d="M5 12.5 10 17.5 19.5 7" />
            </svg>
          </div>
          <h2 className="mb-2.5 font-display text-[30px] leading-[1.12]">Quasi pubblicata</h2>
          <p className="mb-5.5 text-[13.5px] leading-relaxed text-neutral-700">
            L&apos;annuncio è salvato. Resta un ultimo passo prima che sia visibile: firmare il
            mandato in esclusiva — 0% di provvigione a tuo carico, gratis.
          </p>
          <div className="blueprint bg-surface p-4 text-left">
            <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">HAI RISPARMIATO</div>
            <div className="font-display text-[44px] leading-[0.9] text-accent-700">{eur(agencyFor(price))}</div>
            <div className="mt-1.5 text-xs text-neutral-700">di provvigioni che non pagherai a nessuno.</div>
          </div>
          <a
            href={`/venditore/mandato/${listingId}`}
            className="mt-5 block bg-accent-900 py-3.5 text-center font-heading text-sm font-semibold tracking-[0.05em] text-white uppercase hover:bg-blue-800"
          >
            Firma il mandato in esclusiva
          </a>
        </div>
      )}

      {error && <div className="mx-4 mt-3 text-xs text-accent-700">{error}</div>}

      {step <= 3 && (
        <div className="sticky bottom-0 z-30 mt-6 border-t border-divider bg-bg px-4 pt-3 pb-7">
          <Button
            className="w-full"
            disabled={(step === 1 && !canStep1) || busy}
            onClick={() => (step === 3 ? publish() : setStep((s) => s + 1))}
          >
            {busy ? "Pubblico…" : step === 3 ? "Pubblica gratis" : "Continua"}
          </Button>
          <div className="mt-2.5 text-center font-label text-[10px] font-semibold tracking-[0.1em] text-neutral-600">
            SEMPRE 0 € PER TE
          </div>
        </div>
      )}
    </div>
  );
}
