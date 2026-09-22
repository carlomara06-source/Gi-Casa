import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { eur } from "@/lib/pricing";
import { ProposalClient } from "@/components/listing/ProposalClient";

export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect(`/annunci/${id}`);

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.status !== "PUBLISHED") notFound();

  const foglio = await prisma.foglioVisita.findFirst({ where: { userId: session.user.id, listingId: id } });
  if (!foglio) redirect(`/annunci/${id}`);

  const price = listing.price;
  const min = Math.round((price * 0.8) / 500) * 500;
  const max = Math.round((price * 1.15) / 500) * 500;

  return (
    <ProposalClient
      listingId={id}
      addressLine={listing.addressLine}
      requestedPrice={price}
      requestedPriceLabel={eur(price)}
      marketValueLabel={eur(price)}
      min={min}
      max={max}
    />
  );
}
