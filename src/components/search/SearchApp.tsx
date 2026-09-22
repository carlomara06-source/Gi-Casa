"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Button } from "@/components/ui/Button";
import { PropertyCard } from "@/components/search/PropertyCard";
import { TIERS, eur } from "@/lib/pricing";
import type { DecoratedListing } from "@/lib/listings";

const ListingsMap = dynamic(() => import("@/components/ListingsMap").then((m) => m.ListingsMap), {
  ssr: false,
});

const CITY_TILES = [
  { name: "Isola", match: (l: DecoratedListing) => l.city.includes("ISOLA") },
  { name: "NoLo", match: (l: DecoratedListing) => l.city.includes("NOLO") },
  { name: "Navigli", match: (l: DecoratedListing) => l.city.includes("NAVIGLI") },
  { name: "Città Studi", match: (l: DecoratedListing) => l.city.includes("CITTÀ STUDI") },
  { name: "Sesto S. Giovanni", match: (l: DecoratedListing) => l.city.includes("SESTO") },
  { name: "Rho e Bollate", match: (l: DecoratedListing) => l.city.includes("RHO") || l.city.includes("BOLLATE") },
];

const STEPS = [
  { n: "1", t: "Cerchi e vedi subito quanto ti costa", d: "Ogni annuncio porta la tariffa fissa in chiaro, insieme al risparmio rispetto al 3% + IVA di agenzia." },
  { n: "2", t: "Sblocchi i documenti con un codice", d: "Planimetria, visura e APE si aprono firmando il Foglio di Visita via OTP. Il tuo numero non lo vede il venditore." },
  { n: "3", t: "Visiti con un agente abilitato", d: "Siamo un'agenzia ibrida: la visita e la proposta le gestisce un professionista di zona, fino al rogito." },
];

const QUICK_CHIPS = [
  { id: "sub200", label: "≤ 200.000 €" },
  { id: "l3", label: "3+ locali" },
  { id: "lift", label: "Ascensore" },
  { id: "fee2", label: "Flat Fee ≤ 2.500 €" },
];

type Filters = {
  priceMax: number;
  feeMax: number;
  locali: string;
  mqMin: string;
  piano: string;
  stato: string;
  classe: string;
  flags: string[];
  sort: string;
};

const DEFAULT_FILTERS: Filters = {
  priceMax: 700000,
  feeMax: 0,
  locali: "Tutti",
  mqMin: "Tutte",
  piano: "Qualsiasi",
  stato: "Qualsiasi",
  classe: "Tutte",
  flags: [],
  sort: "Più recenti",
};

const FLAGS = [
  { id: "lift", label: "Ascensore" },
  { id: "balcone", label: "Balcone o terrazzo" },
  { id: "cantina", label: "Cantina" },
  { id: "box", label: "Box o posto auto" },
  { id: "giardino", label: "Giardino o cortile privato" },
  { id: "arredato", label: "Arredato" },
];

function chip(active: boolean) {
  return `flex-none whitespace-nowrap rounded-full border px-3 py-1.5 font-body text-[11.5px] font-medium cursor-pointer select-none ${
    active ? "border-blue-600 bg-blue-600 text-white" : "border-divider bg-transparent text-neutral-800"
  }`;
}

function pill(active: boolean) {
  return `cursor-pointer select-none border px-3 py-2 font-body text-[12.5px] font-medium ${
    active ? "border-blue-600 bg-blue-600 text-white" : "border-divider bg-transparent text-neutral-800"
  }`;
}

export function SearchApp({ initialAll }: { initialAll: DecoratedListing[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [searched, setSearched] = useState(Boolean(params.get("s")));
  const [view, setView] = useState<"lista" | "mappa">(params.get("view") === "mappa" ? "mappa" : "lista");
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sheet, setSheet] = useState<"filters" | "tiers" | null>(null);
  const [results, setResults] = useState<DecoratedListing[]>(initialAll);
  const [selectedId, setSelectedId] = useState<string | null>(initialAll[0]?.id ?? null);
  const [loading, setLoading] = useState(false);

  const filterCount =
    activeChips.length +
    filters.flags.length +
    (filters.priceMax < 700000 ? 1 : 0) +
    (filters.feeMax ? 1 : 0) +
    (filters.locali !== "Tutti" ? 1 : 0) +
    (filters.mqMin !== "Tutte" ? 1 : 0) +
    (filters.piano !== "Qualsiasi" ? 1 : 0) +
    (filters.stato !== "Qualsiasi" ? 1 : 0) +
    (filters.classe !== "Tutte" ? 1 : 0) +
    (filters.sort !== "Più recenti" ? 1 : 0);

  const runFetch = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (activeChips.length) p.set("chips", activeChips.join(","));
    if (filters.priceMax < 700000) p.set("priceMax", String(filters.priceMax));
    if (filters.feeMax) p.set("feeMax", String(filters.feeMax));
    if (filters.locali !== "Tutti") p.set("locali", filters.locali);
    if (filters.mqMin !== "Tutte") p.set("mqMin", filters.mqMin);
    if (filters.piano !== "Qualsiasi") p.set("piano", filters.piano);
    if (filters.stato !== "Qualsiasi") p.set("stato", filters.stato);
    if (filters.classe !== "Tutte") p.set("classe", filters.classe);
    if (filters.flags.length) p.set("flags", filters.flags.join(","));
    if (filters.sort !== "Più recenti") p.set("sort", filters.sort);

    const res = await fetch(`/api/listings?${p.toString()}`);
    const data = await res.json();
    setResults(data.results);
    setLoading(false);
  }, [query, activeChips, filters]);

  useEffect(() => {
    // Intentional fetch-on-filter-change: setLoading(true) runs synchronously
    // as the first line of runFetch so the spinner shows immediately, which
    // the new react-hooks/set-state-in-effect rule flags even though it's
    // the standard "kick off a request from an effect" pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (searched) runFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searched, activeChips, filters]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (searched) p.set("s", "1");
    if (query) p.set("q", query);
    if (view === "mappa") p.set("view", "mappa");
    router.replace(`/ricerca${p.toString() ? `?${p}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searched, view]);

  const doSearch = () => setSearched(true);
  const goCity = (name: string) => {
    setQuery(name);
    setSearched(true);
  };

  const selected = results.find((r) => r.id === selectedId) ?? results[0];

  const cityCounts = useMemo(
    () => CITY_TILES.map((c) => ({ ...c, count: initialAll.filter(c.match).length })),
    [initialAll],
  );

  return (
    <div className="min-h-dvh bg-bg pt-[54px]">
      <TopBar
        right={
          <div className="flex items-center gap-2">
            <span className="bg-blue-200 px-1.5 py-1.5 font-body text-[10px] font-medium tracking-[0.07em] text-blue-800">
              0% VENDITORE
            </span>
          </div>
        }
      />

      {/* Hero */}
      <div className="relative overflow-hidden bg-linear-to-b from-[#143049] to-accent-900 px-4 pt-6.5 pb-5.5 text-white">
        <div className="mb-3 font-label text-[10px] font-semibold tracking-[0.2em] text-sun">
          LA CASA CHE CONVIENE
        </div>
        <h1 className="mb-3 font-display text-[35px] leading-[1.1] tracking-[-0.02em]">
          Stai ancora pagando il 4% di provvigioni?
          <br />
          <em className="text-sun not-italic font-normal italic">Con noi è Giàcasa.</em>
        </h1>
        <p className="mb-4.5 text-sm leading-snug opacity-82">
          Chi vende non paga provvigioni. Chi compra conosce il costo dal primo click: una cifra
          fissa a scaglioni, non una percentuale del prezzo.
        </p>
        <div className="grid grid-cols-2 gap-5 border-t border-white/22 pt-4.5">
          <div>
            <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.13em] opacity-65">VENDITORE</div>
            <div className="font-display text-[44px] leading-[0.85] text-sun">0%</div>
            <div className="mt-1.5 text-[11.5px] opacity-80">commissioni, sempre</div>
          </div>
          <div>
            <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.13em] opacity-65">ACQUIRENTE</div>
            <div className="font-display text-[44px] leading-[0.85]">da 1.990 €</div>
            <button
              onClick={() => setSheet("tiers")}
              className="mt-1.5 cursor-pointer text-[11.5px] text-sun underline underline-offset-3"
            >
              vedi i 6 scaglioni
            </button>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 rounded-2xl border border-blue-200 bg-blue-100 px-3.5 py-3.5">
        <div className="mb-1.5 font-label text-[9px] font-semibold tracking-[0.14em] text-blue-700">
          OGNI ANNUNCIO È VERIFICATO DA NOI
        </div>
        <div className="text-[12.5px] leading-snug text-neutral-800">
          Visura, planimetria e APE controllati prima della pubblicazione. Anche negli annunci
          gratuiti.
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 pt-3.5 pb-3.5">
        <div className="blueprint flex items-stretch bg-surface">
          <div className="flex items-center pl-3 text-neutral-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="7" />
              <path d="M16.5 16.5 21 21" />
            </svg>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Città, zona o indirizzo"
            className="min-w-0 flex-1 bg-transparent px-2.5 py-3.5 font-body text-sm outline-none"
          />
          <button
            onClick={doSearch}
            className="bg-accent-600 px-4 font-heading text-[15px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-accent-700"
          >
            Cerca
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setSheet("filters")}
            className={`flex flex-none items-center gap-1.5 px-2.75 py-1.75 font-body text-xs select-none ${
              filterCount
                ? "border border-blue-700 bg-blue-700 text-white"
                : "border border-divider bg-surface text-neutral-800"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 6h18M6 12h12M10 18h4" />
            </svg>
            <span>Filtri</span>
            {filterCount > 0 && (
              <span className="inline-flex h-4.25 min-w-4.25 items-center justify-center bg-white px-1 font-label text-[10px] font-semibold text-blue-800">
                {filterCount}
              </span>
            )}
          </button>
          <div className="flex min-w-0 flex-1 gap-1.75 overflow-x-auto pb-0.5">
            {QUICK_CHIPS.map((c) => (
              <div
                key={c.id}
                onClick={() =>
                  setActiveChips((prev) =>
                    prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id],
                  )
                }
                className={chip(activeChips.includes(c.id))}
              >
                {c.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {!searched ? (
        <>
          <div className="px-4 pt-1.5">
            <div className="mb-5.5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={doSearch}>
                Sfoglia tutte
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSearched(true);
                  setView("mappa");
                }}
              >
                Apri la mappa
              </Button>
            </div>

            <div className="mb-2.5 font-label text-[9.5px] font-semibold tracking-[0.14em] text-blue-700">
              CERCA PER CITTÀ
            </div>
            <div className="mb-6.5 grid grid-cols-2 gap-px border border-divider bg-divider">
              {cityCounts.map((c) => (
                <div
                  key={c.name}
                  onClick={() => goCity(c.name)}
                  className="cursor-pointer bg-surface p-3 hover:bg-blue-100"
                >
                  <div className="font-display text-xl leading-none">{c.name}</div>
                  <div className="mt-1.5 font-label text-[9px] font-semibold tracking-[0.1em] text-neutral-600">
                    {c.count} {c.count === 1 ? "CASA" : "CASE"}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-3 font-label text-[9.5px] font-semibold tracking-[0.14em] text-blue-700">
              COME FUNZIONA
            </div>
            <div className="mb-6.5 flex flex-col gap-4">
              {STEPS.map((s) => (
                <div key={s.n} className="flex items-start gap-3.5">
                  <div className="w-7.5 flex-none font-display text-[32px] leading-[0.85] text-blue-400">{s.n}</div>
                  <div className="min-w-0">
                    <div className="font-heading text-[17px] leading-tight font-semibold">{s.t}</div>
                    <div className="mt-1 text-[12.5px] leading-snug text-neutral-700">{s.d}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-5.5 bg-blue-800 px-4 py-4.5 text-white">
              <div className="mb-2.5 font-label text-[9.5px] font-semibold tracking-[0.14em] text-blue-300">
                LA TUA TARIFFA, DICHIARATA SUBITO
              </div>
              {TIERS.map((t) => (
                <div
                  key={t.range}
                  className="flex items-baseline justify-between gap-3 border-b border-white/18 py-2.25"
                >
                  <span className="text-[12.5px] opacity-85">{t.range}</span>
                  <span className="font-display text-xl">{eur(t.fee)}</span>
                </div>
              ))}
              <div className="mt-3 font-label text-[9.5px] font-semibold tracking-[0.09em] text-blue-300">
                LA TARIFFA FISSA È DOVUTA SOLO A PROPOSTA ACCETTATA.
              </div>
            </div>

            <div className="mb-2 bg-accent-600 px-4 py-4.25 text-white">
              <div className="mb-1.75 font-label text-[9.5px] font-semibold tracking-[0.13em] opacity-82">
                HAI UNA CASA DA VENDERE?
              </div>
              <div className="font-display text-[26px] leading-[1.08]">
                Pubblichi gratis e paghi 0% di provvigione. Il prezzo lo scegli te, con un agente al
                tuo fianco.
              </div>
              <Link href="/valutazione" className="mt-3.25 inline-block bg-white px-3.5 py-2.75 font-heading text-sm font-semibold tracking-[0.05em] text-accent-700 uppercase">
                Valuta gratis
              </Link>
            </div>
          </div>

          <div className="sticky bottom-0 z-20 -mx-0 mt-5.5 flex items-center gap-3 border-t border-divider bg-linear-to-t from-bg from-68% to-transparent px-4 pt-3.25 pb-4.5">
            <div className="min-w-0 flex-1">
              <div className="font-label text-[9px] font-bold tracking-[0.14em] text-neutral-600">
                PASSO 1 DI 4 · TROVA LA CASA
              </div>
              <div className="mt-2 flex gap-1">
                <div className="h-0.75 flex-1 rounded bg-accent-600" />
                <div className="h-0.75 flex-1 rounded bg-neutral-300" />
                <div className="h-0.75 flex-1 rounded bg-neutral-300" />
                <div className="h-0.75 flex-1 rounded bg-neutral-300" />
              </div>
            </div>
            <Button onClick={doSearch}>Vedi le case</Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 px-4 pt-1.5 pb-3">
            <div className="font-label text-[11px] font-semibold tracking-[0.08em] text-neutral-600">
              {loading ? "CERCO…" : `${results.length} ${results.length === 1 ? "CASA" : "CASE"} · TARIFFA NOTA`}
            </div>
            <div className="flex border border-divider">
              <button
                onClick={() => setView("lista")}
                className={`px-3.5 py-1.5 font-heading text-sm font-semibold tracking-[0.04em] uppercase ${
                  view === "lista" ? "bg-accent-900 text-white" : "text-neutral-700"
                }`}
              >
                Lista
              </button>
              <button
                onClick={() => setView("mappa")}
                className={`px-3.5 py-1.5 font-heading text-sm font-semibold tracking-[0.04em] uppercase ${
                  view === "mappa" ? "bg-accent-900 text-white" : "text-neutral-700"
                }`}
              >
                Mappa
              </button>
            </div>
          </div>

          {view === "mappa" ? (
            <div className="px-4 pb-4">
              <div className="blueprint relative h-[404px] bg-blue-100">
                <ListingsMap listings={results} onSelect={setSelectedId} />
              </div>
              <div className="mt-2 font-label text-[8.5px] font-semibold tracking-[0.1em] text-neutral-500">
                MAPPE OPENSTREETMAP · PREZZI AL M² INDICATIVI PER ZONA
              </div>
              {selected && (
                <div className="blueprint mt-3 bg-surface">
                  <div className="flex items-center gap-3 p-3">
                    <div className="h-[60px] w-[68px] flex-none overflow-hidden rounded-[10px]">
                      <div className="h-full w-full bg-neutral-200" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-xl leading-tight">{selected.title}</div>
                      <div className="mt-0.5 text-[11.5px] text-neutral-700">{selected.meta}</div>
                      <div className="mt-1.5 font-label text-[10.5px] font-semibold tracking-[0.06em] text-accent-800">
                        TARIFFA {selected.feeLabel} · RISPARMI {selected.savingLabel}
                      </div>
                    </div>
                  </div>
                  <Link href={`/annunci/${selected.id}`} className="mx-3 mb-3 flex items-center justify-center gap-2 bg-accent-600 py-3.5 font-heading text-[13px] font-bold tracking-[0.08em] text-white uppercase hover:bg-accent-700">
                    Vedi la casa e prenota la visita
                  </Link>
                </div>
              )}
            </div>
          ) : results.length === 0 ? (
            <div className="blueprint mx-4 p-6.5 text-center">
              <div className="font-display text-[22px]">Nessun immobile</div>
              <div className="text-[12.5px] text-neutral-700">Prova a rimuovere un filtro o a cercare un&apos;altra città.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-7 px-4 pb-7">
              {results.map((p) => (
                <PropertyCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </>
      )}

      <div className="h-19" />
      <BottomTabs />

      {sheet === "filters" && (
        <div className="fixed inset-0 z-60 flex items-end bg-blue-900/46" onClick={() => setSheet(null)}>
          <div
            className="max-h-[85vh] w-full overflow-y-auto border-t-2 border-blue-800 bg-bg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-divider bg-bg px-4 pt-4 pb-3">
              <h3 className="font-display text-[26px]">Filtri</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveChips([]);
                    setFilters(DEFAULT_FILTERS);
                  }}
                  className="text-[12.5px] text-blue-700 underline underline-offset-3"
                >
                  Azzera
                </button>
                <button onClick={() => setSheet(null)} className="flex h-7 w-7 items-center justify-center border border-divider text-lg">
                  ×
                </button>
              </div>
            </div>

            <div className="px-4 pt-4.5">
              <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
                PREZZO MASSIMO
              </div>
              <div className="font-display text-2xl">
                {filters.priceMax >= 700000 ? "Nessun limite" : `fino a ${eur(filters.priceMax)}`}
              </div>
              <input
                type="range"
                min={80000}
                max={700000}
                step={10000}
                value={filters.priceMax}
                onChange={(e) => setFilters((f) => ({ ...f, priceMax: Number(e.target.value) }))}
                className="my-3 w-full"
              />
              <div className="flex justify-between font-label text-[9.5px] font-semibold text-neutral-600">
                <span>80.000 €</span>
                <span>700.000 €+</span>
              </div>
            </div>

            <div className="px-4 pt-5">
              <div className="mb-2 flex items-baseline justify-between gap-2.5">
                <div className="font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
                  TARIFFA FISSA MASSIMA
                </div>
              </div>
              <div className="flex flex-wrap gap-1.75">
                {[0, 1990, 2490, 3990, 5490].map((v) => (
                  <div
                    key={v}
                    onClick={() => setFilters((f) => ({ ...f, feeMax: v }))}
                    className={pill(filters.feeMax === v)}
                  >
                    {v === 0 ? "Tutte" : `≤ ${eur(v)}`}
                  </div>
                ))}
              </div>
            </div>

            {[
              { label: "LOCALI (MINIMO)", key: "locali" as const, opts: ["Tutti", "2", "3", "4", "5"] },
              { label: "SUPERFICIE MINIMA", key: "mqMin" as const, opts: ["Tutte", "50", "70", "100", "130"] },
              { label: "PIANO", key: "piano" as const, opts: ["Qualsiasi", "Piano terra", "Intermedio", "Ultimo piano"] },
              { label: "STATO", key: "stato" as const, opts: ["Qualsiasi", "Da ristrutturare", "Buono stato", "Ristrutturato"] },
              { label: "CLASSE ENERGETICA", key: "classe" as const, opts: ["Tutte", "A o B", "C o D", "E o superiore"] },
            ].map((g) => (
              <div key={g.key} className="px-4 pt-5">
                <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
                  {g.label}
                </div>
                <div className="flex flex-wrap gap-1.75">
                  {g.opts.map((o) => (
                    <div
                      key={o}
                      onClick={() => setFilters((f) => ({ ...f, [g.key]: o }))}
                      className={pill(filters[g.key] === o)}
                    >
                      {g.key === "mqMin" && o !== "Tutte" ? `${o} m²` : g.key === "locali" && o !== "Tutti" ? `${o}+` : o}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="px-4 pt-5">
              <div className="mb-2.5 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
                CARATTERISTICHE
              </div>
              <div className="flex flex-col gap-2.5">
                {FLAGS.map((fl) => (
                  <div
                    key={fl.id}
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        flags: f.flags.includes(fl.id) ? f.flags.filter((x) => x !== fl.id) : [...f.flags, fl.id],
                      }))
                    }
                    className="flex cursor-pointer items-center gap-2.75"
                  >
                    <div
                      className={`h-4.5 w-4.5 flex-none border-[1.5px] ${
                        filters.flags.includes(fl.id) ? "border-blue-600 bg-blue-600" : "border-neutral-400 bg-transparent"
                      }`}
                    />
                    <div className="text-[13px]">{fl.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 pt-5">
              <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
                ORDINA PER
              </div>
              <div className="flex flex-wrap gap-1.75">
                {["Più recenti", "Prezzo crescente", "Prezzo decrescente", "Prezzo al m²", "Tariffa più bassa"].map(
                  (o) => (
                    <div key={o} onClick={() => setFilters((f) => ({ ...f, sort: o }))} className={pill(filters.sort === o)}>
                      {o}
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="h-5" />
            <div className="sticky bottom-0 border-t border-divider bg-bg px-4 pt-3 pb-6.5">
              <Button
                className="w-full"
                onClick={() => {
                  setSheet(null);
                  setSearched(true);
                }}
              >
                {results.length === 0 ? "Applica filtri" : `Mostra ${results.length} ${results.length === 1 ? "casa" : "case"}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {sheet === "tiers" && (
        <div className="fixed inset-0 z-60 flex items-end bg-accent-900/46" onClick={() => setSheet(null)}>
          <div className="w-full bg-bg border-t-2 border-accent-900 px-4 pt-5 pb-8.5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-baseline justify-between">
              <h3 className="font-display text-[28px]">Tariffa acquirente</h3>
              <button onClick={() => setSheet(null)} className="font-label text-[11px] font-semibold text-accent-700">
                CHIUDI
              </button>
            </div>
            <p className="mb-3.5 text-[12.5px] text-neutral-700">
              Sei scaglioni sul prezzo di acquisto. Nessuna percentuale, nessuna sorpresa al rogito.
            </p>
            {TIERS.map((t) => (
              <div key={t.range} className="flex items-baseline justify-between gap-3 border-b border-divider py-2.5">
                <span className="text-[13px] text-neutral-800">{t.range}</span>
                <span className="font-display text-xl">{eur(t.fee)}</span>
              </div>
            ))}
            <div className="mt-3.5 border-l-4 border-blue-600 bg-blue-100 p-3">
              <div className="mb-1.5 flex items-baseline justify-between gap-2.5">
                <div className="font-label text-[9.5px] font-semibold tracking-[0.12em] text-blue-700">
                  QUOTA APPUNTAMENTO
                </div>
                <div className="font-display text-2xl leading-none">29 €</div>
              </div>
              <div className="text-xs leading-snug text-neutral-800">
                Per ogni visita confermata, a copertura dell&apos;agente abilitato che ti accompagna.
                Se compri, viene scomputata dalla tariffa fissa: di fatto non la paghi.
              </div>
            </div>
            <div className="mt-3 font-label text-[10px] font-semibold text-neutral-600">
              LA TARIFFA FISSA È DOVUTA SOLO A PROPOSTA ACCETTATA.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
