import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eur, feeFor, agencyFor } from "@/lib/pricing";
import { planById } from "@/lib/plans";
import { weeksSince } from "@/lib/dates";
import { formatDayMonthShort } from "@/lib/dates";
import { GestionaleClient } from "@/components/sell/GestionaleClient";

const DOC_LABEL: Record<string, string> = {
  PLANIMETRIA: "Planimetria catastale",
  VISURA: "Visura catastale",
  APE: "Attestato APE",
  ATTO_PROVENIENZA: "Atto di provenienza",
  REGOLAMENTO_CONDOMINIALE: "Regolamento condominiale",
};

export default async function GestionalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect(`/accesso?callbackUrl=/venditore/gestionale/${id}`);

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { documents: true, subscription: true, seller: true },
  });
  if (!listing) notFound();
  if (listing.sellerId !== session.user.id) redirect("/venditore");

  const visits = await prisma.visit.findMany({
    where: { listingId: id },
    orderBy: { scheduledAt: "asc" },
    include: { agent: true, buyer: true },
  });

  const plan = listing.subscription ? planById(listing.subscription.plan) : null;
  const weeksSincePublish = listing.publishedAt ? weeksSince(listing.publishedAt) : 0;
  const paidSoFar = plan ? plan.costPerWeek * weeksSincePublish : 0;

  return (
    <GestionaleClient
      addressLine={listing.addressLine}
      sellerName={listing.seller.name ?? "Venditore"}
      dati={[
        { k: "PREZZO RICHIESTO", v: eur(listing.price) },
        { k: "TARIFFA ACQUIRENTE", v: eur(feeFor(listing.price)) },
        { k: "SUPERFICIE", v: `${listing.mq} m²` },
        { k: "LOCALI · BAGNI", v: `${listing.locali} · ${listing.bagni}` },
        { k: "PIANO", v: String(listing.piano) },
        { k: "CLASSE ENERGETICA", v: listing.classeEnergetica },
        { k: "CATASTO", v: listing.catastoFoglio ? `F.${listing.catastoFoglio} P.${listing.catastoParticella} S.${listing.catastoSubalterno}` : "Da completare" },
        { k: "RENDITA CATASTALE", v: listing.renditaCatastale ? eur(listing.renditaCatastale) : "—" },
        { k: "SPESE CONDOMINIALI", v: listing.speseCondominiali ? `${eur(listing.speseCondominiali)}/mese` : "—" },
        { k: "DISPONIBILITÀ", v: listing.disponibilita },
      ]}
      docs={listing.documents.map((d) => ({
        name: DOC_LABEL[d.type] ?? d.type,
        meta: d.status === "VERIFIED" ? d.meta || "Verificato" : d.status === "UPLOADED" ? "Caricato, in verifica" : "Da caricare",
        status: d.status,
      }))}
      visite={visits.map((v) => {
        const { day, month } = formatDayMonthShort(v.scheduledAt);
        return {
          day,
          month,
          time: `${String(v.scheduledAt.getHours()).padStart(2, "0")}:${String(v.scheduledAt.getMinutes()).padStart(2, "0")}`,
          who: `Acquirente #${v.buyerId.slice(-4).toUpperCase()}`,
          note: v.agent ? `Accompagnato da ${v.agent.name}, agente partner` : "Foglio di visita firmato con OTP",
          status: v.status,
        };
      })}
      conti={[
        { k: "Servizi settimanali pagati", note: plan ? `${weeksSincePublish} settimane di ${plan.name}` : "—", v: eur(paidSoFar) },
        { k: "Provvigione a tuo carico", note: "sempre e comunque", v: "0 €" },
        { k: "Risparmio rispetto al 3% + IVA", note: "vs. agenzia tradizionale", v: eur(agencyFor(listing.price) - feeFor(listing.price)) },
      ]}
    />
  );
}
