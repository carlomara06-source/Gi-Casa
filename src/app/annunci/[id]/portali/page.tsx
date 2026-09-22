import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { eur, feeFor } from "@/lib/pricing";
import { TopBar } from "@/components/TopBar";
import { Placeholder } from "@/components/ui/Placeholder";

export default async function PortaliPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.status !== "PUBLISHED") notFound();

  type Row = { k: string; v: string; accent?: boolean; blue?: boolean; big?: boolean };

  const cards: {
    plan: string;
    tag: string;
    tagCls: string;
    hasBanner: boolean;
    hasEvidenza: boolean;
    agency: string;
    agencyCls: string;
    meta: string;
    rows: Row[];
  }[] = [
    {
      plan: "PIANO FREE · 0 € A SETTIMANA",
      tag: "CON IL NOSTRO BANNER",
      tagCls: "bg-accent-600 text-white",
      hasBanner: true,
      hasEvidenza: false,
      agency: "GIÀCASA · TARIFFA FISSA",
      agencyCls: "bg-accent-200 text-accent-800",
      meta: "IN LISTA · POSIZIONE ORGANICA",
      rows: [
        { k: "Diffusione sui portali", v: "Attiva" },
        { k: "Nostro banner sull'annuncio", v: "Presente", accent: true },
        { k: "Posizione nei risultati", v: "Organica" },
        { k: "Costo per il venditore", v: "0 €", big: true },
      ],
    },
    {
      plan: "DA VISIBILITY BOOST IN SU",
      tag: "SENZA BANNER",
      tagCls: "bg-blue-800 text-white",
      hasBanner: false,
      hasEvidenza: true,
      agency: "ANNUNCIO VERIFICATO",
      agencyCls: "bg-blue-200 text-blue-800",
      meta: "IN EVIDENZA · PRIME POSIZIONI",
      rows: [
        { k: "Diffusione sui portali", v: "Attiva" },
        { k: "Nostro banner sull'annuncio", v: "Rimosso", blue: true },
        { k: "Posizione nei risultati", v: "In evidenza", blue: true },
        { k: "Costo per il venditore", v: "da 29 €/sett", big: true },
      ],
    },
  ];

  return (
    <div className="min-h-dvh bg-blue-900 pt-[54px] pb-12 text-white">
      <TopBar />
      <div className="px-4 pt-5 md:px-8">
        <div className="mb-1.5 flex flex-wrap items-baseline gap-2.5">
          <span className="font-label text-[10px] font-semibold tracking-[0.1em] text-blue-300">ESEMPIO NON CLICCABILE</span>
        </div>
        <h2 className="mb-2.5 font-display text-[27px] leading-[1.1]">Come ci vedono sui portali esterni</h2>
        <p className="mb-6 max-w-160 text-[13.5px] leading-relaxed text-blue-200">
          Lo stesso immobile, come appare sui grandi portali nei due casi. La diffusione c&apos;è
          sempre, anche nel piano gratuito: cambia solo chi si prende la scena.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((c) => (
            <div key={c.plan}>
              <div className="mb-2.5 flex items-baseline justify-between gap-2.5">
                <div className="font-label text-[9.5px] font-semibold tracking-[0.12em] text-blue-300">{c.plan}</div>
                <div className={`flex-none px-2 py-1.5 font-label text-[9px] font-semibold tracking-[0.11em] ${c.tagCls}`}>{c.tag}</div>
              </div>

              <div className="border border-white/15 bg-white text-[#15120e]">
                <div className="flex items-center justify-between gap-2.5 border-b border-black/10 bg-neutral-100 px-3 py-2.25">
                  <div className="font-label text-[10px] font-semibold tracking-[0.1em] text-neutral-700">PORTALE ESTERNO</div>
                  <div className="flex gap-1.25">
                    <div className="h-1.5 w-6.5 bg-neutral-300" />
                    <div className="h-1.5 w-4 bg-neutral-300" />
                    <div className="h-1.5 w-4 bg-neutral-300" />
                  </div>
                </div>

                <div className="flex gap-3.5 p-3.5">
                  <div className="relative h-[140px] w-[190px] flex-none bg-neutral-200">
                    <Placeholder label="foto annuncio" className="h-full w-full" />
                    {c.hasBanner && (
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-accent-600 px-2.25 py-1.75 text-white">
                        <div className="font-label text-[9px] leading-tight font-semibold tracking-[0.08em]">
                          SU GIÀCASA PAGHI
                          <br />
                          UNA TARIFFA FISSA
                        </div>
                        <div className="flex-none font-display text-[19px] leading-none">{eur(feeFor(listing.price))}</div>
                      </div>
                    )}
                    {c.hasEvidenza && (
                      <div className="absolute top-0 left-0 bg-blue-800 px-2 py-1.25 font-label text-[9px] font-semibold tracking-[0.1em] text-white">
                        IN EVIDENZA
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 font-display text-2xl leading-none">{eur(listing.price)}</div>
                    <div className="mb-1 text-[13px] leading-snug text-neutral-800">
                      {listing.title} · {listing.mq} m²
                    </div>
                    <div className="mb-2.5 text-xs text-neutral-600">
                      {listing.city}, {listing.zone}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-1.75 py-1.5 font-label text-[9px] font-semibold tracking-[0.09em] ${c.agencyCls}`}>{c.agency}</div>
                    </div>
                  </div>
                </div>

                {c.hasBanner && (
                  <div className="border-t border-black/10 bg-accent-100 px-3.5 py-2.75 text-[11.5px] leading-snug text-accent-800">
                    Questo annuncio è gestito su Giàcasa: il venditore non paga provvigioni,
                    l&apos;acquirente una tariffa fissa.
                  </div>
                )}

                <div className="flex flex-col gap-px border-t border-black/10 bg-black/8">
                  {c.rows.map((r) => (
                    <div key={r.k} className="flex items-baseline justify-between gap-3 bg-white px-3.5 py-2.25">
                      <span className="text-xs text-neutral-700">{r.k}</span>
                      <span
                        className={`font-medium text-xs ${r.accent ? "text-accent-700" : r.blue ? "text-blue-700" : ""} ${
                          r.big ? "font-display text-lg" : ""
                        }`}
                      >
                        {r.v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-l-4 border-blue-500 bg-blue-800/60 p-4">
          <div className="mb-1.75 font-label text-[9.5px] font-semibold tracking-[0.12em] text-blue-300">
            PERCHÉ IL BANNER ESISTE
          </div>
          <div className="max-w-160 text-[13px] leading-relaxed text-blue-100">
            Ogni annuncio gratuito che esce sui portali ci porta traffico e ci fa conoscere: è il
            costo che il venditore paga in visibilità condivisa invece che in provvigione. Chi attiva
            un piano se lo ricompra indietro, e in più passa in evidenza.
          </div>
        </div>
      </div>
    </div>
  );
}
