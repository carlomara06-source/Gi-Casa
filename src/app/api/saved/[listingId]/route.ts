import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { listingId } = await params;

  await prisma.savedListing.upsert({
    where: { userId_listingId: { userId: session.user.id, listingId } },
    update: {},
    create: { userId: session.user.id, listingId },
  });
  return NextResponse.json({ saved: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { listingId } = await params;

  await prisma.savedListing.deleteMany({ where: { userId: session.user.id, listingId } });
  return NextResponse.json({ saved: false });
}
