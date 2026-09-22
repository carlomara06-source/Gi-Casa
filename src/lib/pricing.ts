// Buyer flat-fee tiers and the traditional-agency comparison, ported 1:1
// from the design prototype (chats/chat1.md, "inserisci le nuove tariffe").

export const NF = new Intl.NumberFormat("it-IT", {
  useGrouping: "always",
  maximumFractionDigits: 0,
});

export const eur = (n: number) => `${NF.format(n)} €`;

export type Tier = { max: number; fee: number; range: string };

export const TIERS: Tier[] = [
  { max: 99999, fee: 1990, range: "Fino a 99.999 €" },
  { max: 149999, fee: 2490, range: "100.000 – 149.999 €" },
  { max: 299999, fee: 3990, range: "150.000 – 299.999 €" },
  { max: 499999, fee: 5490, range: "300.000 – 499.999 €" },
  { max: 749999, fee: 7490, range: "500.000 – 749.999 €" },
  { max: Infinity, fee: 9990, range: "Oltre 750.000 €" },
];

export function tierFor(price: number): Tier {
  return TIERS.find((t) => price <= t.max) ?? TIERS[TIERS.length - 1];
}

export function feeFor(price: number): number {
  return tierFor(price).fee;
}

/** Traditional agency commission: 3% + 22% VAT, rounded to the nearest 10€. */
export function agencyFor(price: number): number {
  return Math.round(((price * 0.03 * 1.22) / 10)) * 10;
}

/** Appointment fee split: buyer/seller only ever see the 29€ total. */
export const APPOINTMENT_FEE_CENTS = 2900;
export const APPOINTMENT_AGENT_SHARE_CENTS = 1500;
