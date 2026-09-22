import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PORTAL_MAP: Record<string, "IMMOBILIARE" | "IDEALISTA" | "CASA_IT"> = {
  immobiliare: "IMMOBILIARE",
  idealista: "IDEALISTA",
  "casa-it": "CASA_IT",
};

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const STATE_LABEL: Record<string, string> = {
  DA_RISTRUTTURARE: "Da ristrutturare",
  BUONO_STATO: "Buono stato",
  RISTRUTTURATO: "Ristrutturato",
  NUOVO: "Nuovo",
};

// A generic real-estate syndication feed (one <property> per listing) —
// the actual field set every major Italian portal expects from an agency
// feed (address, surface, rooms, floor, energy class, agency contact).
// Real syndication would also need per-portal auth/delivery; this route is
// the deliverable each portal's importer would be pointed at.
export async function GET(req: Request, { params }: { params: Promise<{ portal: string }> }) {
  const { portal: portalSlug } = await params;
  const portal = PORTAL_MAP[portalSlug];
  if (!portal) return NextResponse.json({ error: "unknown_portal" }, { status: 404 });

  const feeds = await prisma.portalSyndication.findMany({
    where: { portal, enabled: true, listing: { status: "PUBLISHED" } },
    include: { listing: { include: { seller: true, photos: true } } },
  });

  const items = feeds
    .map(({ listing, showBanner }) => {
      const description = showBanner
        ? `${listing.description} Annuncio gestito su Giàcasa: il venditore non paga provvigioni, l'acquirente una tariffa fissa. giacasa.it`
        : listing.description;
      return `  <property>
    <id>${xmlEscape(listing.id)}</id>
    <title>${xmlEscape(listing.title)}</title>
    <type>${xmlEscape(listing.type)}</type>
    <price currency="EUR">${listing.price}</price>
    <address>
      <city>${xmlEscape(listing.city)}</city>
      <district>${xmlEscape(listing.zone)}</district>
      <street>${xmlEscape(listing.addressLine)}</street>
      ${listing.lat != null ? `<lat>${listing.lat}</lat>` : ""}
      ${listing.lng != null ? `<lng>${listing.lng}</lng>` : ""}
    </address>
    <surface unit="sqm">${listing.mq}</surface>
    <rooms>${listing.locali}</rooms>
    <bathrooms>${listing.bagni}</bathrooms>
    <floor>${listing.piano}</floor>
    <elevator>${listing.hasLift ? "true" : "false"}</elevator>
    <condition>${xmlEscape(STATE_LABEL[listing.stato] ?? listing.stato)}</condition>
    <energyClass>${xmlEscape(listing.classeEnergetica)}</energyClass>
    <description>${xmlEscape(description)}</description>
    <photos>
${listing.photos.map((p) => `      <photo>${xmlEscape(p.url)}</photo>`).join("\n")}
    </photos>
    <agency>
      <name>Giàcasa</name>
      <contact>chat interna Giàcasa · numero non pubblicato</contact>
    </agency>
    <featured>${showBanner ? "false" : "true"}</featured>
  </property>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed portal="${xmlEscape(portal)}" generatedAt="${new Date().toISOString()}">
${items}
</feed>
`;

  return new NextResponse(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
