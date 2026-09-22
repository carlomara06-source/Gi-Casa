import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/http";
import {
  calculateValuation,
  ZONE_BASE_EUR_MQ,
  type PropertyState,
} from "@/lib/valuation";

const Body = z.object({
  address: z.string().min(3),
  zone: z.enum(Object.keys(ZONE_BASE_EUR_MQ) as [string, ...string[]]),
  mq: z.number().int().positive(),
  piano: z.number().int().min(0),
  ascensore: z.boolean(),
  stato: z.enum(["DA_RISTRUTTURARE", "BUONO_STATO", "RISTRUTTURATO", "NUOVO"]),
  esposizione: z.enum(["Singola", "Doppia esposizione", "Tripla o angolo"]),
  affaccio: z.enum(["Su strada", "Interno silenzioso", "Panoramico"]),
  luminosita: z.enum(["Scarsa", "Buona", "Ottima"]),
  balconiMq: z.number().int().min(0),
  cantinaMq: z.number().int().min(0),
  annoCostruzione: z.number().int().min(1800).max(2100),
});

export async function POST(req: Request) {
  const session = await auth();
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const b = parsed.data;

  const result = calculateValuation({ ...b, stato: b.stato as PropertyState });

  await prisma.valuationRequest.create({
    data: {
      userId: session?.user.id,
      address: b.address,
      mq: b.mq,
      piano: b.piano,
      stato: b.stato as PropertyState,
      balconiMq: b.balconiMq,
      cantinaMq: b.cantinaMq,
      annoCostruzione: b.annoCostruzione,
      ascensore: b.ascensore,
      esposizione: b.esposizione,
      affaccio: b.affaccio,
      luminosita: b.luminosita,
      vuZonaEurMq: result.vuZonaEurMq,
      kTotale: result.kTotale,
      resultLow: result.low,
      resultMid: result.mid,
      resultHigh: result.high,
    },
  });

  return NextResponse.json({ result });
}
