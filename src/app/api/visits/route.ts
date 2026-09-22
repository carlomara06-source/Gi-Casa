import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { APPOINTMENT_FEE_CENTS, APPOINTMENT_AGENT_SHARE_CENTS } from "@/lib/pricing";
import { readJson } from "@/lib/http";

const Body = z.object({
  listingId: z.string(),
  scheduledAt: z.string(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const foglio = await prisma.foglioVisita.findFirst({
    where: { userId: session.user.id, listingId: parsed.data.listingId },
    orderBy: { signedAt: "desc" },
  });
  if (!foglio) {
    return NextResponse.json({ error: "foglio_visita_required" }, { status: 403 });
  }

  const agent = await prisma.agentProfile.findFirst();

  const visit = await prisma.visit.create({
    data: {
      listingId: parsed.data.listingId,
      buyerId: session.user.id,
      agentId: agent?.userId,
      agentProfileId: agent?.id,
      scheduledAt: new Date(parsed.data.scheduledAt),
      status: "CONFIRMED",
      feeCents: APPOINTMENT_FEE_CENTS,
      agentShareCents: APPOINTMENT_AGENT_SHARE_CENTS,
      foglioVisitaId: foglio.id,
    },
  });

  return NextResponse.json({ visit });
}
