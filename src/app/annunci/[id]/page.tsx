import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { eur, NF, feeFor, agencyFor, APPOINTMENT_FEE_CENTS } from "@/lib/pricing";
import { buildBookingDays } from "@/lib/dates";
import { ListingDetailClient } from "@/components/listing/ListingDetailClient";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { seller: true, documents: true },
  });
  if (!listing || listing.status !== "PUBLISHED") notFound();

  // Fire-and-forget view counter for the seller dashboard's stats row.
  void prisma.listing.update({ where: { id: listing.id }, data: { views: { increment: 1 } } });

  const session = await auth();
  const foglio = session
    ? await prisma.foglioVisita.findFirst({ where: { userId: session.user.id, listingId: listing.id } })
    : null;

  const existingVisit = session
    ? await prisma.visit.findFirst({
        where: { listingId: listing.id, buyerId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const agent = await prisma.agentProfile.findFirst({ include: { user: true } });
  const savedListing = session
    ? await prisma.savedListing.findUnique({
        where: { userId_listingId: { userId: session.user.id, listingId: listing.id } },
      })
    : null;

  const fee = feeFor(listing.price);
  const agency = agencyFor(listing.price);

  const now = new Date();
  const rangeEnd = new Date(now);
  rangeEnd.setDate(rangeEnd.getDate() + 6);
  const bookedVisits = await prisma.visit.findMany({
    where: { listingId: listing.id, scheduledAt: { gte: now, lte: rangeEnd }, status: { not: "CANCELED" } },
    select: { scheduledAt: true },
  });
  const bookedSlots = bookedVisits.map((v) => v.scheduledAt.toISOString());
  const days = buildBookingDays(now);

  return (
    <ListingDetailClient
      listing={{
        id: listing.id,
        title: listing.title,
        city: listing.city,
        zone: listing.zone,
        price: listing.price,
        priceLabel: eur(listing.price),
        feeLabel: eur(fee),
        agencyLabel: eur(agency),
        pricePerMqLabel: NF.format(Math.round(listing.price / listing.mq)),
        mq: listing.mq,
        locali: listing.locali,
        bagni: listing.bagni,
        piano: listing.piano,
        hasLift: listing.hasLift,
        classeEnergetica: listing.classeEnergetica,
        description: listing.description,
        ownerName: listing.seller.name ?? "Proprietario",
        documents: listing.documents.map((d) => ({
          id: d.id,
          name:
            d.type === "PLANIMETRIA"
              ? "Planimetria catastale"
              : d.type === "VISURA"
                ? "Visura catastale"
                : d.type === "APE"
                  ? "Attestato APE"
                  : d.type,
          meta: d.meta,
        })),
      }}
      agent={agent ? { name: agent.user.name ?? "Agente", zone: agent.zone, rating: agent.ratingAvg } : null}
      isUnlocked={Boolean(foglio)}
      existingVisit={
        existingVisit
          ? { id: existingVisit.id, scheduledAt: existingVisit.scheduledAt.toISOString(), status: existingVisit.status }
          : null
      }
      appointmentFeeLabel={eur(APPOINTMENT_FEE_CENTS / 100)}
      loggedIn={Boolean(session)}
      bookedSlots={bookedSlots}
      days={days}
      initialSaved={Boolean(savedListing)}
    />
  );
}
