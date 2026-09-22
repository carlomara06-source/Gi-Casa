import "dotenv/config";
import { prisma } from "@/lib/prisma";

// Same 12 demo listings as the design prototype (chats/chat1.md DATA const),
// now real rows instead of an in-memory array.
const LISTINGS = [
  { city: "Milano", zone: "Isola", title: "Via Borsieri 24", price: 189000, mq: 72, locali: 3, piano: 4, lift: true, lat: 45.4880, lng: 9.1905, stato: "BUONO_STATO", classe: "C", balcone: true, cantina: true, box: false, giardino: false, arredato: false },
  { city: "Sesto San Giovanno", zone: "Marelli", title: "Via Marelli 60", price: 132000, mq: 70, locali: 3, piano: 2, lift: true, lat: 45.5350, lng: 9.236, stato: "BUONO_STATO", classe: "D", balcone: true, cantina: true, box: true, giardino: false, arredato: false },
  { city: "Milano", zone: "NoLo", title: "Via Padova 88", price: 158000, mq: 68, locali: 3, piano: 1, lift: false, lat: 45.4990, lng: 9.2273, stato: "DA_RISTRUTTURARE", classe: "F", balcone: false, cantina: true, box: false, giardino: false, arredato: false },
  { city: "Milano", zone: "Navigli", title: "Via Vigevano 12", price: 410000, mq: 105, locali: 4, piano: 3, lift: true, lat: 45.4515, lng: 9.1682, stato: "RISTRUTTURATO", classe: "A", balcone: true, cantina: true, box: true, giardino: false, arredato: true },
  { city: "Segrate", zone: "Milano Due", title: "Residenza Pellico 4", price: 210000, mq: 92, locali: 4, piano: 2, lift: true, lat: 45.4995, lng: 9.2957, stato: "BUONO_STATO", classe: "C", balcone: true, cantina: false, box: true, giardino: true, arredato: true },
  { city: "Milano", zone: "Brera", title: "Via Palermo 5", price: 690000, mq: 128, locali: 4, piano: 2, lift: true, lat: 45.4750, lng: 9.1848, stato: "RISTRUTTURATO", classe: "B", balcone: true, cantina: true, box: true, giardino: false, arredato: false },
  { city: "Milano", zone: "Città Studi", title: "Via Pascoli 45", price: 295000, mq: 95, locali: 4, piano: 3, lift: true, lat: 45.4780, lng: 9.227, stato: "BUONO_STATO", classe: "C", balcone: true, cantina: true, box: false, giardino: false, arredato: false },
  { city: "Rho", zone: "Centro", title: "Via Meda 7", price: 119000, mq: 66, locali: 3, piano: 1, lift: false, lat: 45.5310, lng: 9.0395, stato: "DA_RISTRUTTURARE", classe: "E", balcone: false, cantina: true, box: true, giardino: true, arredato: false },
  { city: "San Donato Milanese", zone: "Centro", title: "Via Europa 14", price: 168000, mq: 78, locali: 3, piano: 4, lift: true, lat: 45.4160, lng: 9.268, stato: "BUONO_STATO", classe: "D", balcone: true, cantina: true, box: true, giardino: false, arredato: false },
  { city: "Milano", zone: "Bicocca", title: "Via Chiese 20", price: 225000, mq: 85, locali: 3, piano: 5, lift: true, lat: 45.5150, lng: 9.213, stato: "RISTRUTTURATO", classe: "B", balcone: true, cantina: false, box: true, giardino: false, arredato: true },
  { city: "Rozzano", zone: "Quinto", title: "Viale Lombardia 33", price: 105000, mq: 62, locali: 2, piano: 6, lift: true, lat: 45.3730, lng: 9.159, stato: "BUONO_STATO", classe: "E", balcone: true, cantina: true, box: false, giardino: false, arredato: false },
  { city: "Monza", zone: "San Biagio", title: "Via Bergamo 18", price: 245000, mq: 98, locali: 4, piano: 3, lift: true, lat: 45.5870, lng: 9.2744, stato: "BUONO_STATO", classe: "C", balcone: true, cantina: true, box: true, giardino: true, arredato: false },
] as const;

async function main() {
  const seller = await prisma.user.upsert({
    where: { phone: "+390000000001" },
    update: {},
    create: { phone: "+390000000001", name: "Giulia Ferraro", role: "SELLER" },
  });

  const agentUser = await prisma.user.upsert({
    where: { phone: "+390000000002" },
    update: {},
    create: { phone: "+390000000002", name: "Luca Riva", role: "AGENT" },
  });

  await prisma.agentProfile.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: {
      userId: agentUser.id,
      zone: "Isola, Milano",
      ratingAvg: 4.9,
      reviewCount: 38,
      bio: "Agente abilitato · Isola, Milano",
    },
  });

  for (const l of LISTINGS) {
    const existing = await prisma.listing.findFirst({
      where: { addressLine: l.title, sellerId: seller.id },
    });
    const listing =
      existing ??
      (await prisma.listing.create({
        data: {
          sellerId: seller.id,
          title: l.title,
          addressLine: l.title,
          city: l.city,
          zone: l.zone,
          lat: l.lat,
          lng: l.lng,
          price: l.price,
          mq: l.mq,
          locali: l.locali,
          bagni: 1,
          piano: l.piano,
          hasLift: l.lift,
          stato: l.stato as never,
          classeEnergetica: l.classe,
          balcone: l.balcone,
          cantina: l.cantina,
          box: l.box,
          giardino: l.giardino,
          arredato: l.arredato,
          description:
            "Trilocale con doppia esposizione, infissi recenti e cantina inclusa. A pochi minuti dai mezzi pubblici.",
          status: "PUBLISHED",
          publishedAt: new Date(),
          catastoFoglio: "12",
          catastoParticella: "340",
          catastoSubalterno: "7",
          renditaCatastale: 742,
          speseCondominiali: 85,
        },
      }));

    await prisma.subscription.upsert({
      where: { listingId: listing.id },
      update: {},
      create: { listingId: listing.id, plan: "FREE", cycle: "WEEK", status: "ACTIVE" },
    });

    for (const portal of ["IMMOBILIARE", "IDEALISTA", "CASA_IT"] as const) {
      await prisma.portalSyndication.upsert({
        where: { listingId_portal: { listingId: listing.id, portal } },
        update: {},
        create: { listingId: listing.id, portal, enabled: true, showBanner: true },
      });
    }

    const docs: { type: "PLANIMETRIA" | "VISURA" | "APE"; meta: string }[] = [
      { type: "PLANIMETRIA", meta: "PDF · caricata di recente" },
      { type: "VISURA", meta: "PDF · verificata dall'agente" },
      { type: "APE", meta: `Classe ${l.classe}, valido fino al 2031` },
    ];
    for (const d of docs) {
      const has = await prisma.document.findFirst({ where: { listingId: listing.id, type: d.type } });
      if (!has) {
        await prisma.document.create({
          data: { listingId: listing.id, type: d.type, status: "VERIFIED", meta: d.meta, verifiedAt: new Date() },
        });
      }
    }

    if (listing.addressLine === "Via Borsieri 24") {
      const has = await prisma.mandate.findUnique({ where: { listingId: listing.id } });
      if (!has) {
        const now = new Date();
        const expires = new Date(now);
        expires.setMonth(expires.getMonth() + 6);
        const withdrawable = new Date(now);
        withdrawable.setDate(withdrawable.getDate() + 30);
        await prisma.mandate.create({
          data: {
            listingId: listing.id,
            signedAt: now,
            expiresAt: expires,
            withdrawableFrom: withdrawable,
            signatureHash: "seed-demo-mandate",
          },
        });
      }
    }
  }

  console.log(`Seeded ${LISTINGS.length} listings for seller ${seller.name} (${seller.phone}).`);
  console.log(`Demo agent: ${agentUser.name} (${agentUser.phone}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
