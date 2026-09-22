"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { eur } from "@/lib/pricing";

type Proposal = {
  id: string;
  amount: number;
  depositCents: number;
  depositPct: number;
  who: string;
  status: string;
  note: string;
};

export function ProposalsPanel({ marketValue, proposals }: { marketValue: number; proposals: Proposal[] }) {
  const router = useRouter();
  const [countering, setCountering] = useState<string | null>(null);
  const [counterValue, setCounterValue] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(id: string, action: "accept" | "reject" | "counter", counterAmount?: number) {
    setBusy(id);
    try {
      await fetch(`/api/proposals/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, counterAmount }),
      });
      setCountering(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (proposals.length === 0) {
    return <div className="text-[12.5px] text-neutral-600">Nessuna proposta ricevuta finora.</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {proposals.map((p) => {
        const diff = p.amount - marketValue;
        const pct = Math.abs((diff / marketValue) * 100).toFixed(1).replace(".", ",");
        const isCountering = countering === p.id;
        return (
          <div key={p.id} className="blueprint bg-surface p-3.5">
            <div className="flex items-baseline justify-between gap-2.5">
              <div className="font-display text-[28px] leading-none">{eur(p.amount)}</div>
              <div className="flex-none font-label text-[9.5px] font-semibold tracking-[0.1em] text-neutral-600">{p.who}</div>
            </div>
            <div
              className={`mt-2.25 inline-block px-2 py-1.5 font-label text-[10px] font-semibold tracking-[0.1em] ${
                diff >= 0 ? "bg-blue-200 text-blue-800" : "bg-sun-200 text-sun-700"
              }`}
            >
              {diff >= 0 ? `SOPRA IL VALORE DI MERCATO DI ${eur(diff)} (+${pct}%)` : `SOTTO IL VALORE DI MERCATO DI ${eur(-diff)} (−${pct}%)`}
            </div>
            <div className="mt-2.25 mb-3 text-xs leading-snug text-neutral-700">{p.note}</div>

            <div className="mb-3 flex flex-col gap-px bg-divider">
              {[
                { k: "Caparra confirmatoria", v: eur(p.depositCents / 100) },
                { k: "Valore di mercato stimato", v: eur(marketValue) },
                { k: "A saldo al rogito", v: eur(p.amount - p.depositCents / 100) },
              ].map((r) => (
                <div key={r.k} className="flex items-baseline justify-between gap-2.5 bg-surface py-2.25">
                  <div className="text-xs">{r.k}</div>
                  <div className="font-display text-lg">{r.v}</div>
                </div>
              ))}
            </div>

            {p.status === "PENDING" && !isCountering && (
              <div className="flex gap-1.75">
                <button
                  disabled={busy === p.id}
                  onClick={() => decide(p.id, "accept")}
                  className="flex-1 bg-accent-600 py-2.75 font-heading text-[13px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-accent-700"
                >
                  Accetta
                </button>
                <button
                  disabled={busy === p.id}
                  onClick={() => {
                    setCountering(p.id);
                    setCounterValue(p.amount + 4000);
                  }}
                  className="flex-1 bg-blue-600 py-2.75 font-heading text-[13px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-blue-700"
                >
                  Controproponi
                </button>
                <button
                  disabled={busy === p.id}
                  onClick={() => decide(p.id, "reject")}
                  className="flex-none border border-divider px-3 py-2.75 font-heading text-[13px] font-semibold tracking-[0.04em] text-neutral-700 uppercase hover:bg-accent-100"
                >
                  No
                </button>
              </div>
            )}

            {isCountering && (
              <div className="border border-blue-600 bg-blue-100 p-3">
                <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-blue-700">
                  LA TUA CONTROPROPOSTA
                </div>
                <div className="font-display text-[30px] leading-none">{eur(counterValue)}</div>
                <input
                  type="range"
                  min={p.amount}
                  max={p.amount + 25000}
                  step={1000}
                  value={counterValue}
                  onChange={(e) => setCounterValue(Number(e.target.value))}
                  className="my-3 w-full"
                />
                <div className="flex gap-1.75">
                  <button
                    disabled={busy === p.id}
                    onClick={() => decide(p.id, "counter", counterValue)}
                    className="flex-1 bg-blue-600 py-2.75 font-heading text-[13px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-blue-700"
                  >
                    Invia con firma
                  </button>
                  <button
                    onClick={() => setCountering(null)}
                    className="flex-none border border-blue-400 px-3 py-2.75 font-heading text-[13px] font-semibold tracking-[0.04em] text-blue-700 uppercase"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            )}

            {p.status !== "PENDING" && (
              <div
                className={`px-2.75 py-2.5 text-center font-label text-[10px] font-semibold tracking-[0.1em] ${
                  p.status === "ACCEPTED" ? "bg-accent-600 text-white" : p.status === "COUNTERED" ? "bg-blue-600 text-white" : "bg-neutral-200 text-neutral-700"
                }`}
              >
                {p.status === "ACCEPTED" ? "ACCETTATA · CAPARRA INCASSATA" : p.status === "COUNTERED" ? "CONTROPROPOSTA INVIATA" : "RIFIUTATA · CAPARRA RESTITUITA"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
