"use client";

import { useState } from "react";
import { TopBar } from "@/components/TopBar";

const TABS = [
  { id: "immobile", label: "Immobile" },
  { id: "documenti", label: "Documenti" },
  { id: "visite", label: "Visite" },
  { id: "incassi", label: "Conti" },
] as const;

export function GestionaleClient({
  addressLine,
  sellerName,
  dati,
  docs,
  visite,
  conti,
}: {
  addressLine: string;
  sellerName: string;
  dati: { k: string; v: string }[];
  docs: { name: string; meta: string; status: string }[];
  visite: { day: string; month: string; time: string; who: string; note: string; status: string }[];
  conti: { k: string; note: string; v: string }[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("immobile");

  return (
    <div className="min-h-dvh bg-bg pt-[54px] pb-10">
      <TopBar />
      <div className="px-4 pt-3">
        <div className="font-label text-[10px] font-semibold tracking-[0.14em] text-neutral-600">
          GESTIONALE · {sellerName.toUpperCase()}
        </div>
        <div className="mt-1.5 font-display text-[30px] leading-none">{addressLine}</div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto border-b border-divider px-4 py-3.5">
        {TABS.map((t) => (
          <div
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-none cursor-pointer px-3 py-2 font-heading text-sm font-semibold tracking-[0.03em] whitespace-nowrap ${
              tab === t.id ? "border border-accent-900 bg-accent-900 text-white" : "border border-divider text-neutral-700"
            }`}
          >
            {t.label}
          </div>
        ))}
      </div>

      {tab === "immobile" && (
        <div className="px-4 pt-4">
          <div className="grid grid-cols-2 gap-px border border-divider bg-divider">
            {dati.map((d) => (
              <div key={d.k} className="bg-bg p-2.75">
                <div className="mb-1.5 font-label text-[8.5px] font-semibold tracking-[0.1em] text-neutral-600">{d.k}</div>
                <div className="font-display text-xl leading-none">{d.v}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 font-label text-[9.5px] leading-relaxed font-semibold tracking-[0.07em] text-neutral-600">
            MODIFICABILI FINO ALLA PRIMA PROPOSTA ACCETTATA.
          </div>
        </div>
      )}

      {tab === "documenti" && (
        <div className="px-4 pt-4">
          <div className="flex flex-col gap-2.5">
            {docs.map((d) => (
              <div key={d.name} className="flex items-center justify-between gap-3 border border-divider p-3">
                <div className="min-w-0">
                  <div className="font-heading text-base font-semibold">{d.name}</div>
                  <div className="mt-0.75 text-[11.5px] text-neutral-600">{d.meta}</div>
                </div>
                <div
                  className={`flex-none px-2.25 py-2 font-label text-[10px] font-semibold tracking-[0.1em] ${
                    d.status === "VERIFIED" ? "border border-accent-300 text-accent-700" : "bg-accent-600 text-white"
                  }`}
                >
                  {d.status === "VERIFIED" ? "OK" : "CARICA"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "visite" && (
        <div className="px-4 pt-4">
          {visite.length === 0 ? (
            <div className="text-[12.5px] text-neutral-600">Nessuna visita prenotata finora.</div>
          ) : (
            <div className="flex flex-col gap-px bg-divider">
              {visite.map((v, i) => (
                <div key={i} className="flex gap-3 bg-bg py-3.25">
                  <div className="w-13 flex-none">
                    <div className="font-display text-xl leading-none">{v.day}</div>
                    <div className="mt-1 font-label text-[9px] font-semibold tracking-[0.1em] text-neutral-600">{v.month}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-heading text-base font-semibold">{v.time} · {v.who}</div>
                    <div className="mt-0.75 text-[11.5px] text-neutral-700">{v.note}</div>
                    <div className="mt-2 inline-block bg-accent-200 px-1.75 py-1.25 font-label text-[9px] font-semibold tracking-[0.11em] text-accent-800">
                      {v.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "incassi" && (
        <div className="px-4 pt-4">
          <div className="flex flex-col gap-px border border-divider bg-divider">
            {conti.map((c) => (
              <div key={c.k} className="flex items-baseline justify-between gap-3 bg-bg p-3">
                <div>
                  <div className="text-[12.5px]">{c.k}</div>
                  <div className="mt-0.75 text-[10.5px] text-neutral-600">{c.note}</div>
                </div>
                <div className="font-display text-xl">{c.v}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 font-label text-[9.5px] leading-relaxed font-semibold tracking-[0.07em] text-neutral-600">
            LA TARIFFA DELL&apos;ACQUIRENTE NON TOCCA IL TUO INCASSO: LA PAGA LUI, AL ROGITO.
          </div>
        </div>
      )}
    </div>
  );
}
