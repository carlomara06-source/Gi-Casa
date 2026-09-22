import { prisma } from "@/lib/prisma";
import { eur, feeFor, agencyFor } from "@/lib/pricing";
import type { Listing, User } from "@/generated/prisma/client";

export type ListingWithSeller = Listing & { seller: User };

export type ListingFilters = {
  q?: string;
  chips?: string[]; // sub200 | l3 | lift | fee2
  priceMax?: number;
  feeMax?: number;
  locali?: string; // "Tutti" | "2".."5"
  mqMin?: string; // "Tutte" | "50".."130"
  piano?: string; // "Qualsiasi" | "Piano terra" | "Intermedio" | "Ultimo piano"
  stato?: string; // "Qualsiasi" | "Da ristrutturare" | "Buono stato" | "Ristrutturato"
  classe?: string; // "Tutte" | "A o B" | "C o D" | "E o superiore"
  flags?: string[]; // lift | balcone | cantina | box | giardino | arredato
  sort?: string;
};

const STATE_LABEL: Record<string, string> = {
  DA_RISTRUTTURARE: "Da ristrutturare",
  BUONO_STATO: "Buono stato",
  RISTRUTTURATO: "Ristrutturato",
  NUOVO: "Nuovo",
};

function classeMatches(classe: string, group: string): boolean {
  if (group === "A o B") return classe === "A" || classe === "B";
  if (group === "C o D") return classe === "C" || classe === "D";
  if (group === "E o superiore") return ["E", "F", "G"].includes(classe);
  return true;
}

export async function findListings(filters: ListingFilters) {
  const all = await prisma.listing.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: { seller: true },
  });

  let out = all.filter((p) => {
    if (filters.q) {
      const q = filters.q.trim().toLowerCase();
      if (q && !(`${p.city} ${p.zone} ${p.title}`.toLowerCase().includes(q))) return false;
    }
    if (filters.chips?.includes("sub200") && p.price > 200000) return false;
    if (filters.chips?.includes("l3") && p.locali < 3) return false;
    if (filters.chips?.includes("lift") && !p.hasLift) return false;
    if (filters.chips?.includes("fee2") && feeFor(p.price) > 2500) return false;

    if (filters.priceMax && p.price > filters.priceMax) return false;
    if (filters.feeMax && feeFor(p.price) > filters.feeMax) return false;

    if (filters.locali && filters.locali !== "Tutti" && p.locali < Number(filters.locali)) return false;
    if (filters.mqMin && filters.mqMin !== "Tutte" && p.mq < Number(filters.mqMin)) return false;

    if (filters.piano === "Piano terra" && p.piano !== 0) return false;
    if (filters.piano === "Intermedio" && (p.piano < 1 || p.piano > 4)) return false;
    if (filters.piano === "Ultimo piano" && p.piano < 5) return false;

    if (filters.stato && filters.stato !== "Qualsiasi" && STATE_LABEL[p.stato] !== filters.stato) return false;
    if (filters.classe && filters.classe !== "Tutte" && !classeMatches(p.classeEnergetica, filters.classe)) return false;

    if (filters.flags?.includes("lift") && !p.hasLift) return false;
    if (filters.flags?.includes("balcone") && !p.balcone) return false;
    if (filters.flags?.includes("cantina") && !p.cantina) return false;
    if (filters.flags?.includes("box") && !p.box) return false;
    if (filters.flags?.includes("giardino") && !p.giardino) return false;
    if (filters.flags?.includes("arredato") && !p.arredato) return false;

    return true;
  });

  if (filters.sort === "Prezzo crescente") out = [...out].sort((a, b) => a.price - b.price);
  else if (filters.sort === "Prezzo decrescente") out = [...out].sort((a, b) => b.price - a.price);
  else if (filters.sort === "Tariffa più bassa") out = [...out].sort((a, b) => feeFor(a.price) - feeFor(b.price));
  else if (filters.sort === "Prezzo al m²") out = [...out].sort((a, b) => a.price / a.mq - b.price / b.mq);

  return out;
}

export type DecoratedListing = ReturnType<typeof decorateListing>;

export function decorateListing(p: ListingWithSeller) {
  const fee = feeFor(p.price);
  const agency = agencyFor(p.price);
  const ownerName = p.seller.name ?? "Proprietario";
  return {
    id: p.id,
    city: `${p.city.toUpperCase()} · ${p.zone.toUpperCase()}`,
    title: p.title,
    price: p.price,
    priceLabel: eur(p.price),
    fee,
    feeLabel: eur(fee),
    agency,
    agencyLabel: eur(agency),
    saving: agency - fee,
    savingLabel: eur(agency - fee),
    meta: `${p.mq} m² · ${p.locali} locali · piano ${p.piano}`,
    mq: p.mq,
    locali: p.locali,
    piano: p.piano,
    hasLift: p.hasLift,
    stato: STATE_LABEL[p.stato],
    classe: p.classeEnergetica,
    owner: ownerName,
    initial: ownerName.charAt(0).toUpperCase(),
    lat: p.lat,
    lng: p.lng,
  };
}
