// AI valuation "estimo" engine — ported 1:1 from the prototype's coefficient
// tables (chats/chat1.md, "coefficienti dell'estimo"). Every coefficient here
// is the same multiplier the design used, just moved server-side so the
// front end can't be trusted to compute its own price.

export type PropertyState = "DA_RISTRUTTURARE" | "BUONO_STATO" | "RISTRUTTURATO" | "NUOVO";
export const PROPERTY_STATES: { id: PropertyState; label: string }[] = [
  { id: "DA_RISTRUTTURARE", label: "Da ristrutturare" },
  { id: "BUONO_STATO", label: "Buono stato" },
  { id: "RISTRUTTURATO", label: "Ristrutturato" },
  { id: "NUOVO", label: "Nuovo" },
];

const STATE_K: Record<PropertyState, number> = {
  DA_RISTRUTTURARE: 0.78,
  BUONO_STATO: 1,
  RISTRUTTURATO: 1.14,
  NUOVO: 1.26,
};

export const ESPOSIZIONE = ["Singola", "Doppia esposizione", "Tripla o angolo"] as const;
export const AFFACCIO = ["Su strada", "Interno silenzioso", "Panoramico"] as const;
export const LUMINOSITA = ["Scarsa", "Buona", "Ottima"] as const;

const ESP_K: Record<string, number> = { Singola: 0.97, "Doppia esposizione": 1.03, "Tripla o angolo": 1.06 };
const AFF_K: Record<string, number> = { "Su strada": 0.96, "Interno silenzioso": 1.02, Panoramico: 1.08 };
const LUCE_K: Record<string, number> = { Scarsa: 0.95, Buona: 1, Ottima: 1.04 };

/** OMI-style base value per zone, €/m². Isola matches the prototype's demo (2650). */
export const ZONE_BASE_EUR_MQ: Record<string, number> = {
  Isola: 2650,
  NoLo: 2320,
  Navigli: 3900,
  Brera: 5400,
  "Città Studi": 3100,
  Bicocca: 2650,
  "Sesto San Giovanno": 1880,
  Rho: 1800,
  "San Donato Milanese": 2150,
  Rozzano: 1700,
  Monza: 2500,
  Segrate: 2280,
};

export function floorCoefficient(piano: number, ascensore: boolean): number {
  const base = piano === 0 ? 0.9 : piano === 1 ? 0.95 : piano === 2 ? 0.98 : piano >= 5 ? 1.06 : 1.02;
  const k = ascensore ? base : base * (piano >= 3 ? 0.88 : 0.96);
  return Number(k.toFixed(3));
}

export function vetustaCoefficient(annoCostruzione: number): { k: number; label: string } {
  if (annoCostruzione < 1950) return { k: 0.93, label: "Storico · 0,93" };
  if (annoCostruzione < 1980) return { k: 0.96, label: "Da recuperare · 0,96" };
  if (annoCostruzione < 2000) return { k: 1.0, label: "Standard · 1,00" };
  return { k: 1.05, label: "Recente · 1,05" };
}

export type ValuationInput = {
  zone: string;
  mq: number;
  piano: number;
  ascensore: boolean;
  stato: PropertyState;
  esposizione: (typeof ESPOSIZIONE)[number];
  affaccio: (typeof AFFACCIO)[number];
  luminosita: (typeof LUMINOSITA)[number];
  balconiMq: number;
  cantinaMq: number;
  annoCostruzione: number;
};

export type ValuationResult = {
  vuZonaEurMq: number;
  superficieCommerciale: number;
  kPiano: number;
  kStato: number;
  kEsp: number;
  kAff: number;
  kLuce: number;
  kVetusta: number;
  kVetustaLabel: string;
  kTotale: number;
  prezzoMq: number;
  mid: number;
  low: number;
  high: number;
};

export function calculateValuation(input: ValuationInput): ValuationResult {
  const vuZonaEurMq = ZONE_BASE_EUR_MQ[input.zone] ?? 2200;
  const superficieCommerciale = Math.round(
    input.mq + input.balconiMq * 0.25 + input.cantinaMq * 0.25,
  );
  const kPiano = floorCoefficient(input.piano, input.ascensore);
  const kStato = STATE_K[input.stato];
  const kEsp = ESP_K[input.esposizione] ?? 1;
  const kAff = AFF_K[input.affaccio] ?? 1;
  const kLuce = LUCE_K[input.luminosita] ?? 1;
  const { k: kVetusta, label: kVetustaLabel } = vetustaCoefficient(input.annoCostruzione);

  const kTotale = Number((kPiano * kStato * kEsp * kAff * kLuce * kVetusta).toFixed(3));
  const prezzoMq = Math.round(vuZonaEurMq * kTotale);
  const mid = Math.round((prezzoMq * superficieCommerciale) / 1000) * 1000;
  const low = Math.round((mid * 0.92) / 1000) * 1000;
  const high = Math.round((mid * 1.09) / 1000) * 1000;

  return {
    vuZonaEurMq,
    superficieCommerciale,
    kPiano,
    kStato,
    kEsp,
    kAff,
    kLuce,
    kVetusta,
    kVetustaLabel,
    kTotale,
    prezzoMq,
    mid,
    low,
    high,
  };
}
