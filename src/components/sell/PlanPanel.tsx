"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PLANS, type PlanId } from "@/lib/plans";

export function PlanPanel({
  listingId,
  currentPlan,
  paused,
}: {
  listingId: string;
  currentPlan: PlanId;
  paused: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "pause" | "resume" | "downgrade") {
    setBusy(true);
    try {
      await fetch(`/api/subscriptions/${listingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-3.5 font-label text-[9.5px] font-semibold tracking-[0.1em] text-neutral-600">
        {paused ? "FATTURAZIONE SOSPESA · NESSUN ADDEBITO" : currentPlan === "FREE" ? "NESSUN ADDEBITO ATTIVO · PIANO GRATUITO" : "ADDEBITO SETTIMANALE ATTIVO"}
      </div>

      <div className="flex flex-col gap-3.5">
        {PLANS.map((p) => {
          const active = currentPlan === p.id;
          return (
            <div
              key={p.id}
              className={`p-3.75 ${active ? "bg-accent-900 text-white" : "border border-divider bg-surface"}`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div>
                  <div className="font-display text-[26px] leading-none">{p.name}</div>
                  <div className="mt-1 text-[11.5px] leading-snug opacity-80">{p.target}</div>
                </div>
                <div className="flex-none text-right">
                  <div className="font-display text-[26px] leading-none">{p.costPerWeek === 0 ? "0 €" : `${p.costPerWeek} €`}</div>
                  <div className="mt-1 font-label text-[9px] font-semibold tracking-[0.1em] opacity-70">A SETTIMANA</div>
                </div>
              </div>
              <div
                className={`mt-2.75 inline-block px-1.75 py-1.25 font-label text-[9px] font-semibold tracking-[0.12em] ${
                  active ? "bg-accent-300 text-accent-900" : "bg-accent-200 text-accent-800"
                }`}
              >
                {active ? (paused ? "IN PAUSA" : "PIANO ATTIVO") : p.tagLabel}
              </div>
              <div className="mt-3 flex flex-col gap-1.75">
                {p.features.slice(0, 4).map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <div className={`mt-1.5 h-1.5 w-1.5 flex-none ${active ? "bg-accent-300" : "bg-accent-600"}`} />
                    <div className="text-xs leading-snug">{f}</div>
                  </div>
                ))}
              </div>
              {active ? (
                <div className="mt-3.5 border border-accent-400/60 py-2.75 text-center font-heading text-[15px] font-semibold tracking-[0.05em] text-accent-300 uppercase opacity-70">
                  Piano attuale
                </div>
              ) : p.id === "FREE" ? (
                <button
                  disabled={busy}
                  onClick={() => act("downgrade")}
                  className="mt-3.5 w-full border border-divider py-2.75 text-center font-heading text-[15px] font-semibold tracking-[0.05em] text-neutral-700 uppercase hover:bg-accent-100"
                >
                  Passa al Free
                </button>
              ) : (
                <Link
                  href={`/abbonamenti?listingId=${listingId}&plan=${p.id}`}
                  className="mt-3.5 block bg-accent-600 py-2.75 text-center font-heading text-[15px] font-semibold tracking-[0.05em] text-white uppercase hover:bg-accent-700"
                >
                  Attiva · {p.costPerWeek} €/sett
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3.5 flex gap-2">
        <button
          disabled={busy}
          onClick={() => act(paused ? "resume" : "pause")}
          className={`flex-1 py-2.75 text-center font-heading text-[13px] font-semibold tracking-[0.04em] uppercase ${
            paused ? "bg-accent-600 text-white" : "border border-divider text-neutral-700 hover:bg-accent-100"
          }`}
        >
          {paused ? "Riattiva annuncio" : "Metti in pausa"}
        </button>
        {currentPlan !== "FREE" && (
          <button disabled={busy} onClick={() => act("downgrade")} className="flex-1 border border-divider py-2.75 text-center font-heading text-[13px] font-semibold tracking-[0.04em] text-neutral-700 uppercase hover:bg-accent-100">
            Passa al Free
          </button>
        )}
      </div>
      <div className="mt-2.5 font-label text-[9.5px] leading-relaxed font-semibold tracking-[0.08em] text-neutral-600">
        NESSUN VINCOLO · PAUSA O DOWNGRADE IMMEDIATI
      </div>
    </div>
  );
}
