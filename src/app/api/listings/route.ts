import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { findListings, decorateListing } from "@/lib/listings";
import { readJson } from "@/lib/http";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const p = url.searchParams;

  const listings = await findListings({
    q: p.get("q") ?? undefined,
    chips: p.get("chips")?.split(",").filter(Boolean),
    priceMax: p.get("priceMax") ? Number(p.get("priceMax")) : undefined,
    feeMax: p.get("feeMax") ? Number(p.get("feeMax")) : undefined,
    locali: p.get("locali") ?? undefined,
    mqMin: p.get("mqMin") ?? undefined,
    piano: p.get("piano") ?? undefined,
    stato: p.get("stato") ?? undefined,
    classe: p.get("classe") ?? undefined,
    flags: p.get("flags")?.split(",").filter(Boolean),
    sort: p.get("sort") ?? undefined,
  });

  return NextResponse.json({ results: listings.map(decorateListing) });
}

const CreateBody = z.object({
  addressLine: z.string().min(3),
  city: z.string().min(1),
  zone: z.string().min(1),
  type: z.enum(["APPARTAMENTO", "VILLA", "ATTICO", "RUSTICO"]),
  mq: z.number().int().positive(),
  locali: z.number().int().positive(),
  price: z.number().int().positive(),
  portals: z.array(z.enum(["IMMOBILIARE", "IDEALISTA", "CASA_IT"])),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = CreateBody.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const b = parsed.data;

  // Published only once the exclusivity mandate is signed (screen 07) —
  // created here as a draft that isn't visible in search yet.
  const listing = await prisma.listing.create({
    data: {
      sellerId: session.user.id,
      title: b.addressLine,
      addressLine: b.addressLine,
      city: b.city,
      zone: b.zone,
      type: b.type,
      price: b.price,
      mq: b.mq,
      locali: b.locali,
      piano: 0,
      status: "DRAFT",
      subscription: { create: { plan: "FREE", cycle: "WEEK", status: "ACTIVE" } },
      portalFeeds: {
        create: b.portals.map((portal) => ({ portal, enabled: true, showBanner: true })),
      },
      documents: {
        create: [
          { type: "PLANIMETRIA", status: "MISSING" },
          { type: "VISURA", status: "MISSING" },
          { type: "APE", status: "MISSING" },
        ],
      },
    },
  });

  return NextResponse.json({ listing });
}
