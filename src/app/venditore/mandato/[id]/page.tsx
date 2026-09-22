import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDateIt } from "@/lib/dates";
import { MandateClient } from "@/components/sell/MandateClient";

export default async function MandatoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect(`/accesso?callbackUrl=/venditore/mandato/${id}`);

  const listing = await prisma.listing.findUnique({ where: { id }, include: { mandate: true } });
  if (!listing) notFound();
  if (listing.sellerId !== session.user.id) redirect("/menu");

  return (
    <MandateClient
      listingId={id}
      addressLine={listing.addressLine}
      alreadySigned={Boolean(listing.mandate)}
      signedAtLabel={listing.mandate ? formatDateIt(listing.mandate.signedAt) : null}
      expiresAtLabel={listing.mandate ? formatDateIt(listing.mandate.expiresAt) : null}
    />
  );
}
