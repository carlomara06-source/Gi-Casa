"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { eur, feeFor, agencyFor } from "@/lib/pricing";
import { PROPERTY_STATES, ESPOSIZIONE, AFFACCIO, LUMINOSITA, ZONE_BASE_EUR_MQ, type ValuationResult } from "@/lib/valuation";

const ZONES = Object.keys(ZONE_BASE_EUR_MQ);

function K(n: number) {
  return n.toFixed(2).replace(".", ",");
}

function chip(active: boolean) {
  return `cursor-pointer select-none border px-3 py-2 font-body text-[12.5px] font-medium ${
    active ? "border-blue-600 bg-blue-600 text-white" : "border-divider bg-transparent text-neutral-800"
  }`;
}

export function ValuationClient() {
  const [address, setAddress] = useState("");
  const [zone, setZone] = useState(ZONES[0]);
  const [mq, setMq] = useState("70");
  const [piano, setPiano] = useState("2");
  const [stato, setStato] = useState<(typeof PROPERTY_STATES)[number]["id"]>("BUONO_STATO");
  const [ascensore, setAscensore] = useState(true);
  const [esposizione, setEsposizione] = useState<(typeof ESPOSIZIONE)[number]>("Doppia esposizione");
  const [affaccio, setAffaccio] = useState<(typeof AFFACCIO)[number]>("Interno silenzioso");
  const [luminosita, setLuminosita] = useState<(typeof LUMINOSITA)[number]>("Buona");
  const [balconi, setBalconi] = useState("8");
  const [cantina, setCantina] = useState("6");
  const [anno, setAnno] = useState("1975");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [ask, setAsk] = useState(0);

  async function runValuation() {
    setBusy(true);
    try {
      const res = await fetch("/api/valuations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address || `${zone}, Milano`,
          zone,
          mq: Number(mq) || 1,
          piano: Number(piano) || 0,
          ascensore,
          stato,
          esposizione,
          affaccio,
          luminosita,
          balconiMq: Number(balconi) || 0,
          cantinaMq: Number(cantina) || 0,
          annoCostruzione: Number(anno) || 1980,
        }),
      });
      const data = await res.json();
      setResult(data.result);
      setAsk(Math.round(data.result.mid / 1000) * 1000);
    } finally {
      setBusy(false);
    }
  }

  const askVerdict = result
    ? ask > result.high
      ? { t: "SOPRA LA FORBICE", a: "Puoi provarci, ma in zona le case sopra la stima restano online il doppio del tempo.", cls: "bg-accent-200 text-accent-700" }
      : ask < result.low
        ? { t: "SOTTO LA FORBICE", a: "A questo prezzo vendi in fretta, ma probabilmente lasci soldi sul tavolo.", cls: "bg-sun-200 text-sun-700" }
        : { t: "IN LINEA CON LA ZONA", a: "Prezzo coerente con le compravendite degli ultimi 90 giorni.", cls: "bg-blue-200 text-blue-700" }
    : null;

  return (
    <div className="min-h-dvh bg-bg pt-[54px] pb-10">
      <TopBar right={<span className="font-label text-[10px] font-semibold tracking-[0.12em] text-blue-600">VALUTAZIONE · GRATIS</span>} />

      <div className="bg-blue-900 px-4 pt-6 pb-5.5 text-white">
        <div className="mb-3 font-label text-[10px] font-semibold tracking-[0.17em] text-blue-300">
          STIMA IA + AGENTE ABILITATO
        </div>
        <h2 className="mb-3 font-display text-[31px] leading-[1.1] tracking-[-0.018em]">
          Il prezzo lo scegli te,{" "}
          <em className="font-medium text-sun not-italic">
            ma hai sempre un professionista al tuo fianco a consigliarti.
          </em>
        </h2>
        <p className="text-[13.5px] leading-snug opacity-82">
          La nostra IA legge migliaia di compravendite della tua zona e ti dà una forbice in trenta
          secondi. Poi un agente di zona la conferma o te la corregge, gratis e senza impegno.
        </p>
      </div>

      <div className="px-4 pt-5">
        <div className="mb-1.75 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">INDIRIZZO</div>
        <div className="blueprint mb-4 bg-surface">
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Via, civico, città" className="w-full bg-transparent px-3 py-3.25 font-body text-[15px] outline-none" />
        </div>

        <div className="mb-1.75 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">ZONA</div>
        <div className="mb-4 flex flex-wrap gap-1.75">
          {ZONES.map((z) => (
            <div key={z} onClick={() => setZone(z)} className={chip(zone === z)}>{z}</div>
          ))}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1.75 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">METRI QUADRI</div>
            <div className="blueprint bg-surface">
              <input value={mq} onChange={(e) => setMq(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} className="w-full bg-transparent px-3 py-2 font-display text-2xl outline-none" />
            </div>
          </div>
          <div>
            <div className="mb-1.75 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">PIANO</div>
            <div className="blueprint bg-surface">
              <input value={piano} onChange={(e) => setPiano(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))} className="w-full bg-transparent px-3 py-2 font-display text-2xl outline-none" />
            </div>
          </div>
        </div>

        <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">STATO DELL&apos;IMMOBILE</div>
        <div className="mb-5 flex flex-wrap gap-1.75">
          {PROPERTY_STATES.map((s) => (
            <div key={s.id} onClick={() => setStato(s.id)} className={chip(stato === s.id)}>{s.label}</div>
          ))}
        </div>

        <div className="border-t border-divider pt-4.5">
          <div className="mb-1 flex items-baseline justify-between gap-2.5">
            <div className="font-display text-2xl">Coefficienti di estimo</div>
            <div className="flex-none bg-blue-200 px-1.75 py-1.5 font-label text-[9px] font-semibold text-blue-800">OPZIONALE</div>
          </div>
          <p className="mb-4 text-xs leading-snug text-neutral-700">
            Più ne compili, più la stima si avvicina a una perizia.
          </p>

          <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
            SUPERFICI ACCESSORIE
          </div>
          <div className="mb-4.5 grid grid-cols-2 gap-2.5">
            <div>
              <div className="mb-1.25 text-[11px] text-neutral-700">Balconi e terrazzi (m²)</div>
              <div className="blueprint bg-surface">
                <input value={balconi} onChange={(e) => setBalconi(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} className="w-full bg-transparent px-2.75 py-1.75 font-display text-xl outline-none" />
              </div>
            </div>
            <div>
              <div className="mb-1.25 text-[11px] text-neutral-700">Cantina e box (m²)</div>
              <div className="blueprint bg-surface">
                <input value={cantina} onChange={(e) => setCantina(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} className="w-full bg-transparent px-2.75 py-1.75 font-display text-xl outline-none" />
              </div>
            </div>
          </div>

          {[
            { label: "ASCENSORE", cur: ascensore ? "Con ascensore" : "Senza ascensore", opts: ["Con ascensore", "Senza ascensore"], set: (v: string) => setAscensore(v === "Con ascensore") },
            { label: "ESPOSIZIONE", cur: esposizione, opts: ESPOSIZIONE, set: (v: string) => setEsposizione(v as typeof esposizione) },
            { label: "AFFACCIO", cur: affaccio, opts: AFFACCIO, set: (v: string) => setAffaccio(v as typeof affaccio) },
            { label: "LUMINOSITÀ", cur: luminosita, opts: LUMINOSITA, set: (v: string) => setLuminosita(v as typeof luminosita) },
          ].map((p) => (
            <div key={p.label} className="mb-3.5">
              <div className="mb-1.75 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">{p.label}</div>
              <div className="flex flex-wrap gap-1.75">
                {p.opts.map((o) => (
                  <div key={o} onClick={() => p.set(o)} className={chip(p.cur === o)}>{o}</div>
                ))}
              </div>
            </div>
          ))}

          <div className="mb-4 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
            ANNO DI COSTRUZIONE
          </div>
          <div className="blueprint mb-5 bg-surface">
            <input value={anno} onChange={(e) => setAnno(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} className="w-full bg-transparent px-3 py-2 font-display text-xl outline-none" />
          </div>
        </div>

        <Button className="w-full" disabled={busy} onClick={runValuation}>
          {busy ? "Calcolo…" : result ? "Ricalcola la stima" : "Valuta gratis con l'IA"}
        </Button>
        <div className="mt-2.5 font-label text-[9.5px] leading-relaxed font-semibold tracking-[0.08em] text-neutral-600">
          GRATIS E SENZA IMPEGNO. NON DEVI PUBBLICARE NIENTE PER SAPERE QUANTO VALE.
        </div>
      </div>

      {result && askVerdict && (
        <div className="px-4 pt-6">
          <div className="bg-blue-800 p-4 text-white">
            <div className="mb-2.5 font-label text-[9.5px] font-semibold tracking-[0.14em] text-blue-300">
              STIMA IA · {zone.toUpperCase()}, MILANO
            </div>
            <div className="flex items-baseline gap-2">
              <div className="font-display text-4xl leading-[0.9]">{eur(result.low)}</div>
              <div className="font-display text-2xl opacity-60">—</div>
              <div className="font-display text-4xl leading-[0.9] text-sun">{eur(result.high)}</div>
            </div>
            <div className="mt-4 mb-2 text-xs opacity-82">
              {result.vuZonaEurMq.toLocaleString("it-IT")} €/m² di zona × coefficiente {K(result.kTotale)} ×{" "}
              {result.superficieCommerciale} m² commerciali.
            </div>
          </div>

          <div className="border border-t-0 border-divider bg-surface">
            <div className="bg-blue-100 px-3 py-2.5 font-label text-[9px] font-semibold tracking-[0.11em] text-blue-700">
              COME CI SIAMO ARRIVATI
            </div>
            {[
              { k: "Valore unitario di zona", note: `banca dati OMI · ${zone}`, v: `${result.vuZonaEurMq.toLocaleString("it-IT")} €/m²` },
              { k: "Superficie commerciale", note: `${mq} m² + accessori`, v: `${result.superficieCommerciale} m²` },
              { k: "Coefficiente di piano e ascensore", note: `piano ${piano}`, v: K(result.kPiano) },
              { k: "Stato conservativo", note: stato.toLowerCase(), v: K(result.kStato) },
              { k: "Esposizione, affaccio e luce", note: `${esposizione.toLowerCase()}`, v: K(result.kEsp * result.kAff * result.kLuce) },
              { k: "Vetustà", note: `costruito nel ${anno}`, v: K(result.kVetusta) },
              { k: "Coefficiente complessivo", note: "prodotto dei coefficienti di merito", v: K(result.kTotale) },
            ].map((r) => (
              <div key={r.k} className="flex items-baseline justify-between gap-3 border-t border-divider px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-[12.5px]">{r.k}</div>
                  <div className="mt-0.5 text-[10.5px] text-neutral-600">{r.note}</div>
                </div>
                <div className="flex-none font-label text-sm font-semibold text-blue-700">{r.v}</div>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-3 bg-blue-800 p-3 text-white">
              <div className="font-label text-[9.5px] font-semibold tracking-[0.11em]">VALORE DI STIMA PIÙ PROBABILE</div>
              <div className="font-display text-2xl text-sun">{eur(result.mid)}</div>
            </div>
          </div>

          <div className="border border-t-0 border-divider bg-surface p-4">
            <div className="mb-2.5 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
              IL PREZZO CHE VUOI CHIEDERE
            </div>
            <div className="font-display text-[44px] leading-[0.9]">{eur(ask)}</div>
            <input type="range" min={80000} max={420000} step={5000} value={ask} onChange={(e) => setAsk(Number(e.target.value))} className="my-3.5 w-full" />
            <div className={`inline-block px-2 py-1.75 font-label text-[10px] font-semibold tracking-[0.1em] ${askVerdict.cls}`}>
              {askVerdict.t}
            </div>
            <div className="mt-2.5 text-[12.5px] leading-snug text-neutral-700">{askVerdict.a}</div>
          </div>

          <div className="mt-4 border-l-4 border-blue-600 bg-blue-100 p-3.75">
            <div className="mb-2.5 flex items-center gap-2.75">
              <div className="flex h-10.5 w-10.5 flex-none items-center justify-center rounded-full bg-blue-200 font-semibold text-blue-800">L</div>
              <div>
                <div className="font-heading text-[17px] font-semibold">Luca Riva</div>
                <div className="mt-1 font-label text-[9.5px] font-semibold tracking-[0.1em] text-blue-700">AGENTE ABILITATO · MILANO · 4,9★</div>
              </div>
            </div>
            <div className="text-[13px] leading-snug text-neutral-800">
              &ldquo;La stima è coerente con le compravendite recenti in zona. Se vuoi ne parliamo
              prima che pubblichi: dieci minuti, gratis.&rdquo;
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-px bg-divider">
            {[
              { k: "Provvigione a tuo carico", v: "0 €" },
              { k: "Tariffa che pagherà l'acquirente", v: eur(feeFor(ask)) },
              { k: "Risparmio rispetto al 3% + IVA", v: eur(agencyFor(ask)) },
            ].map((f) => (
              <div key={f.k} className="flex items-baseline justify-between gap-3 bg-bg py-3">
                <span className="text-[12.5px] text-neutral-700">{f.k}</span>
                <span className="font-display text-xl">{f.v}</span>
              </div>
            ))}
          </div>

          <Link href="/vendi" className="mt-4.5 flex items-center justify-center bg-accent-600 py-3.5 text-center font-heading text-[17px] font-semibold tracking-[0.05em] text-white uppercase hover:bg-accent-700">
            Pubblica a {eur(ask)}
          </Link>
        </div>
      )}
    </div>
  );
}
