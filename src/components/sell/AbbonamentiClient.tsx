"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { PLANS, cycleCost, type PlanId } from "@/lib/plans";

const WELCOME_BOX = [
  { k: "CARTELLO VENDESI SMART", v: "Professionale, con QR code personalizzato e chip NFC. Da appendere al balcone o al cancello." },
  { k: "FASCICOLO RILEGATO", v: "Perizia dell'immobile e report completo, stampati e rilegati." },
  { k: "GUIDA AL ROGITO", v: "Brochure con tutti i passaggi, dalla proposta al notaio." },
  { k: "CONSEGNA", v: "Corriere in 24/48 ore dall'attivazione. Nessun costo aggiuntivo." },
];

const MATRIX: { label: string; b: boolean; m: boolean; f: boolean; l: boolean }[] = [
  { label: "Annuncio su app e sito Giàcasa", b: true, m: true, f: true, l: true },
  { label: "Chat anonima e calendario visite", b: true, m: true, f: true, l: true },
  { label: "Proposte vincolanti con firma digitale", b: true, m: true, f: true, l: true },
  { label: "Controllo completo della documentazione", b: true, m: true, f: true, l: true },
  { label: "Diffusione su Immobiliare.it, Idealista, Casa.it", b: true, m: true, f: true, l: true },
  { label: "Servizio fotografico professionale", b: false, m: true, f: true, l: true },
  { label: "Annuncio esterno senza il nostro banner", b: false, m: true, f: true, l: true },
  { label: "Badge verificato e in evidenza", b: false, m: true, f: true, l: true },
  { label: "Welcome Box fisica a domicilio in 24/48h", b: false, m: true, f: true, l: true },
  { label: "Visite svolte da un agente partner", b: false, m: false, f: true, l: true },
  { label: "Assistenza in trattativa e al rogito", b: false, m: false, f: true, l: true },
  { label: "Foto e video con riprese da drone", b: false, m: false, f: false, l: true },
  { label: "Home staging virtuale e render", b: false, m: false, f: false, l: true },
];

const FAQ = [
  { q: "Devo firmare un mandato?", a: "Sì: siamo un'agenzia ibrida, quindi c'è un mandato in esclusiva di 6 mesi. Non porta provvigioni a tuo carico e dopo 30 giorni puoi recedere senza penali." },
  { q: "Se metto in pausa perdo le statistiche?", a: "No. L'annuncio viene nascosto agli acquirenti e gli addebiti si fermano; dati, chat e proposte restano dove sono." },
  { q: "Chi controlla i documenti della casa?", a: "Lo facciamo noi, su ogni annuncio, anche nel piano gratuito: visura, planimetria, APE e conformità catastale." },
  { q: "Il mio annuncio esce sui portali anche gratis?", a: "Sì, sempre: Immobiliare.it, Idealista e Casa.it in ogni piano. Nel piano Free l'annuncio esterno porta il nostro banner; con un piano a pagamento lo togliamo." },
  { q: "Chi paga la tariffa fissa?", a: "L'acquirente, e solo a visita confermata e proposta accettata. Da 1.990 € a 9.990 € secondo lo scaglione di prezzo." },
];

function dot(v: boolean) {
  return v ? "h-2.25 w-2.25 bg-accent-600" : "h-[1.5px] w-2.25 bg-neutral-400";
}

export function AbbonamentiClient() {
  const router = useRouter();
  const params = useSearchParams();
  const listingId = params.get("listingId");
  const preselect = params.get("plan") as PlanId | null;

  const [cycle, setCycle] = useState<"WEEK" | "FOUR_WEEK">("WEEK");
  const [modalPlan, setModalPlan] = useState<PlanId | null>(preselect);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthly = cycle === "FOUR_WEEK";
  const plan = modalPlan ? PLANS.find((p) => p.id === modalPlan)! : null;

  async function confirm() {
    if (!plan) return;
    if (!listingId) {
      router.push("/venditore");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, plan: plan.id, cycle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "checkout_failed");
      router.push(data.redirectUrl);
    } catch {
      setError("Non siamo riusciti ad attivare il piano. Riprova.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg pt-[54px] pb-10">
      <TopBar right={<span className="font-label text-[10px] font-semibold tracking-[0.12em] text-neutral-600">ABBONAMENTI</span>} />

      <div className="bg-accent-900 px-4 pt-6.5 pb-5.5 text-white">
        <div className="mb-3 font-label text-[10px] font-semibold tracking-[0.16em] text-blue-300">
          SERVIZI A SETTIMANA · SENZA VINCOLI
        </div>
        <h2 className="mb-2.5 font-display text-[31px] leading-[1.1] tracking-[-0.018em]">
          Vendi sempre a 0%.
          <br />
          <em className="font-medium text-sun not-italic">Se vuoi, ti diamo una mano.</em>
        </h2>
        <p className="mb-5 text-[13.5px] leading-snug opacity-85">
          Le provvigioni non tornano mai. Paghi solo la visibilità e il supporto che scegli, una
          settimana alla volta: metti in pausa o disdici in un clic.
        </p>
        <div className="grid grid-cols-3 gap-px bg-white/22">
          {[
            { n: "+300%", k: "VISITE CON VISIBILITY BOOST" },
            { n: "0%", k: "PROVVIGIONE, IN OGNI PIANO" },
            { n: "1 clic", k: "PER PAUSA O DISDETTA" },
          ].map((pp) => (
            <div key={pp.k} className="bg-accent-900 pt-3 pb-1 px-2">
              <div className="font-display text-[27px] leading-[0.9] text-blue-300">{pp.n}</div>
              <div className="mt-1.5 font-label text-[8.5px] font-semibold tracking-[0.09em] opacity-75">{pp.k}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="mb-1.5 flex border border-divider">
          <button
            onClick={() => setCycle("WEEK")}
            className={`flex-1 py-2.5 text-center font-heading text-sm font-semibold tracking-[0.03em] ${
              !monthly ? "bg-accent-900 text-white" : "text-neutral-700"
            }`}
          >
            1 settimana
          </button>
          <button
            onClick={() => setCycle("FOUR_WEEK")}
            className={`flex-1 py-2.5 text-center font-heading text-sm font-semibold tracking-[0.03em] ${
              monthly ? "bg-accent-900 text-white" : "text-neutral-700"
            }`}
          >
            4 settimane · −15%
          </button>
        </div>
        <div className="mb-4 font-label text-[9.5px] font-semibold tracking-[0.1em] text-accent-700">
          {monthly ? "RISPARMI IL 15% PAGANDO 4 SETTIMANE IN ANTICIPO" : "PAGHI UNA SETTIMANA ALLA VOLTA, SENZA VINCOLI"}
        </div>

        <div className="blueprint mb-4.5 bg-surface p-4">
          <div className="mb-2.25 font-label text-[9.5px] font-semibold tracking-[0.13em] text-accent-700">
            INCLUSO IN TUTTI I PIANI, ANCHE GRATIS
          </div>
          <div className="font-display text-[27px] leading-[1.08] tracking-[-0.01em]">
            Il controllo della documentazione lo facciamo noi. Sempre.
          </div>
          <div className="mt-2.25 text-[12.5px] leading-snug text-neutral-700">
            Visura, planimetria, APE e conformità catastale verificati prima della pubblicazione, su
            ogni immobile.
          </div>
        </div>

        <div className="mb-4.5 border border-accent-600 bg-accent-100">
          <div className="flex items-center justify-between gap-2.5 bg-accent-600 px-4 py-2.75 text-white">
            <div className="font-label text-[9.5px] font-semibold tracking-[0.13em]">SPEDITA A CASA IN 24/48 ORE</div>
            <div className="flex-none font-label text-[9px] font-semibold tracking-[0.1em] opacity-85">DA 29 €/SETT</div>
          </div>
          <div className="p-4">
            <div className="font-display text-[27px] leading-[1.08] tracking-[-0.01em]">La Welcome Box</div>
            <div className="mt-2.25 grid grid-cols-2 gap-px border border-divider bg-divider">
              {WELCOME_BOX.map((wb) => (
                <div key={wb.k} className="bg-accent-100 p-3">
                  <div className="mb-1.5 font-label text-[8.5px] font-semibold tracking-[0.1em] text-accent-700">{wb.k}</div>
                  <div className="text-xs leading-snug text-neutral-800">{wb.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {PLANS.map((p) => {
            const hero = p.id === "SMART_AGENT";
            const cost = cycleCost(p.costPerWeek, cycle);
            return (
              <div
                key={p.id}
                className={`p-4 ${hero ? "border-2 border-accent-600 bg-accent-900 text-white" : "border border-divider bg-surface"}`}
              >
                <div
                  className={`inline-block px-1.75 py-1.25 font-label text-[9px] font-semibold tracking-[0.12em] ${
                    hero ? "bg-sun text-accent-900" : "bg-accent-200 text-accent-800"
                  }`}
                >
                  {hero ? "CONSIGLIATO · ZERO STRESS" : p.tagLabel}
                </div>
                <div className="mt-3 flex items-start justify-between gap-2.5">
                  <div>
                    <div className="font-display text-[29px] leading-none">{p.name}</div>
                    <div className="mt-1.25 text-[11.5px] leading-snug opacity-80">{p.target}</div>
                  </div>
                  <div className="flex-none text-right">
                    <div className="font-display text-[34px] leading-[0.9]">{cost === 0 ? "0 €" : `${cost} €`}</div>
                    <div className="mt-1.25 font-label text-[8.5px] font-semibold tracking-[0.1em] opacity-70">
                      {monthly ? "OGNI 4 SETTIMANE" : "A SETTIMANA"}
                    </div>
                  </div>
                </div>
                <div className="mt-3.5 flex flex-col gap-1.75">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <div className={`mt-1.5 h-1.5 w-1.5 flex-none ${hero ? "bg-accent-300" : "bg-accent-600"}`} />
                      <div className="text-xs leading-snug">{f}</div>
                    </div>
                  ))}
                </div>
                {p.id === "FREE" ? (
                  <div className="mt-3.75 border border-divider py-3 text-center font-heading text-[15px] font-semibold tracking-[0.05em] text-neutral-500 uppercase">
                    Gratis per sempre
                  </div>
                ) : (
                  <button
                    onClick={() => setModalPlan(p.id)}
                    className="mt-3.75 w-full bg-accent-600 py-3.25 text-center font-heading text-[15px] font-semibold tracking-[0.05em] text-white uppercase hover:bg-accent-700"
                  >
                    Attiva {p.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-7">
        <h3 className="mb-3 font-display text-2xl">Cosa cambia</h3>
        <div className="border border-divider">
          <div className="grid grid-cols-[1fr_38px_38px_38px_38px] bg-blue-800 text-white">
            <div className="px-2.5 py-2.25 font-label text-[9px] font-semibold tracking-[0.1em]">SERVIZIO</div>
            <div className="py-2.25 text-center font-label text-[9px] font-semibold">FREE</div>
            <div className="py-2.25 text-center font-label text-[9px] font-semibold text-sun">29€</div>
            <div className="py-2.25 text-center font-label text-[9px] font-semibold text-sun">59€</div>
            <div className="py-2.25 text-center font-label text-[9px] font-semibold text-sun">99€</div>
          </div>
          {MATRIX.map((m) => (
            <div key={m.label} className="grid grid-cols-[1fr_38px_38px_38px_38px] items-center border-t border-divider">
              <div className="p-2.5 text-[11.5px] leading-snug">{m.label}</div>
              <div className="flex justify-center"><div className={dot(m.b)} /></div>
              <div className="flex justify-center"><div className={dot(m.m)} /></div>
              <div className="flex justify-center"><div className={dot(m.f)} /></div>
              <div className="flex justify-center"><div className={dot(m.l)} /></div>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_38px_38px_38px_38px] items-center bg-blue-100">
            <div className="p-2.5 font-label text-[11px] font-semibold tracking-[0.06em] text-blue-700">PROVVIGIONE</div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="text-center font-display text-base text-blue-700">0%</div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-7">
        <h3 className="mb-3 font-display text-2xl">Domande rapide</h3>
        <div className="flex flex-col gap-px bg-divider">
          {FAQ.map((q, i) => (
            <div key={q.q} onClick={() => setOpenFaq((v) => (v === i ? null : i))} className="cursor-pointer bg-bg py-3.25">
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-heading text-base font-semibold tracking-[0.01em]">{q.q}</div>
                <div className="font-label text-sm font-semibold text-accent-700">{openFaq === i ? "−" : "+"}</div>
              </div>
              {openFaq === i && <div className="mt-2 text-[12.5px] leading-snug text-neutral-700">{q.a}</div>}
            </div>
          ))}
        </div>
      </div>

      {modalPlan && plan && (
        <div className="fixed inset-0 z-60 flex items-end bg-accent-900/46" onClick={() => setModalPlan(null)}>
          <div className="w-full bg-bg px-4 pt-5 pb-8.5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 className="font-display text-[28px] leading-none">Attiva {plan.name}</h3>
              <button onClick={() => setModalPlan(null)} className="font-label text-[11px] font-semibold text-accent-700">CHIUDI</button>
            </div>
            <div className="mb-3.5 flex flex-col gap-px bg-divider">
              {[
                { k: "Piano", v: plan.name },
                { k: monthly ? "Costo ogni 4 settimane" : "Costo settimanale", v: `${cycleCost(plan.costPerWeek, cycle)} €` },
                { k: "Provvigione sulla vendita", v: "0%" },
              ].map((r) => (
                <div key={r.k} className="flex items-baseline justify-between gap-3 bg-bg py-2.5">
                  <span className="text-[12.5px] text-neutral-700">{r.k}</span>
                  <span className="font-display text-xl">{r.v}</span>
                </div>
              ))}
            </div>
            {!listingId && (
              <p className="mb-3 text-xs text-accent-700">
                Scegli prima l&apos;annuncio da potenziare dalla tua dashboard.
              </p>
            )}
            {error && <p className="mb-3 text-xs text-accent-700">{error}</p>}
            <button
              disabled={busy}
              onClick={confirm}
              className="flex w-full items-center justify-center bg-neutral-900 py-3.5 font-heading text-[17px] font-semibold text-white uppercase hover:bg-neutral-800"
            >
              {busy ? "Un attimo…" : listingId ? "Attiva il piano" : "Vai alla dashboard"}
            </button>
            <div className="mt-2.5 font-label text-[9.5px] leading-relaxed font-semibold tracking-[0.08em] text-neutral-600">
              ADDEBITO RICORRENTE. PAUSA O DOWNGRADE IN 1 CLIC.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
