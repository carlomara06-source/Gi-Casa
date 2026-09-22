// Seller subscription plans, ported 1:1 from the prototype's PLANS constant
// (chats/chat1.md — "Piani Abbonamento Venditori").

export type PlanId = "FREE" | "VISIBILITY_BOOST" | "SMART_AGENT" | "CONCIERGE_LUXURY";

export type PlanDef = {
  id: PlanId;
  name: string;
  costPerWeek: number;
  tagLabel: string;
  target: string;
  features: string[];
};

export const PLANS: PlanDef[] = [
  {
    id: "FREE",
    name: "Free",
    costPerWeek: 0,
    tagLabel: "FAI DA TE",
    target: "Per chi vuole risparmiare al 100% e gestisce tutto in autonomia.",
    features: [
      "Annuncio pubblicato su app e sito Giàcasa",
      "Foto e planimetrie caricate da te",
      "Messaggi e richieste visita in chat anonima",
      "Calendario e visite gestite da te",
      "Proposte d'acquisto vincolanti con firma digitale",
      "Diffusione su Immobiliare.it, Idealista e Casa.it, con il nostro banner sull'annuncio esterno",
      "Controllo completo della documentazione: visura, planimetria, APE e conformità catastale verificati da noi",
    ],
  },
  {
    id: "VISIBILITY_BOOST",
    name: "Visibility Boost",
    costPerWeek: 29,
    tagLabel: "PIÙ SCELTO",
    target: "Per chi vuole massima visibilità senza perdere tempo.",
    features: [
      "Tutto il piano Free",
      "Servizio fotografico professionale a domicilio",
      "Annuncio sui portali senza il nostro banner promozionale",
      "Badge “Verificato e in evidenza” in mappa e ricerca",
      "Report settimanale: click, visualizzazioni, salvataggi",
      "Welcome Box a domicilio in 24/48h: cartello Vendesi Smart con QR e NFC, fascicolo rilegato, guida al rogito",
    ],
  },
  {
    id: "SMART_AGENT",
    name: "Smart Agent",
    costPerWeek: 59,
    tagLabel: "CONSIGLIATO · ZERO STRESS",
    target: "Per chi non ha tempo per le visite o vive lontano dall'immobile.",
    features: [
      "Tutto il piano Visibility Boost",
      "Un agente partner locale prende le chiavi e fa tutte le visite",
      "Assistenza dell'agente in negoziazione e al rogito",
      "Welcome Box con perizia rilegata e cartello NFC personalizzato",
    ],
  },
  {
    id: "CONCIERGE_LUXURY",
    name: "Concierge Luxury",
    costPerWeek: 99,
    tagLabel: "IMMOBILI DI PREGIO",
    target: "Per immobili di pregio che vanno raccontati, non solo pubblicati.",
    features: [
      "Tutto il piano Smart Agent",
      "Servizio foto e video con riprese da drone",
      "Home staging virtuale e planimetria renderizzata",
      "Agente dedicato con visite solo su acquirenti pre-qualificati",
    ],
  },
];

export const planById = (id: PlanId) => PLANS.find((p) => p.id === id)!;

/** 4-week billing cycle applies a 15% discount, rounded to the nearest euro. */
export function cycleCost(costPerWeek: number, cycle: "WEEK" | "FOUR_WEEK"): number {
  if (costPerWeek === 0) return 0;
  return cycle === "FOUR_WEEK" ? Math.round(costPerWeek * 4 * 0.85) : costPerWeek;
}
