import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/http";
import { redactContactInfo } from "@/lib/redact";

async function assertAccess(threadId: string, userId: string) {
  const thread = await prisma.chatThread.findUnique({ where: { id: threadId }, include: { listing: true } });
  if (!thread) return null;
  const allowed = thread.buyerId === userId || thread.listing?.sellerId === userId;
  return allowed ? thread : null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await params;
  const thread = await assertAccess(id, session.user.id);
  if (!thread) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const messages = await prisma.chatMessage.findMany({
    where: { threadId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: true },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      isSystem: m.isSystem,
      mine: m.senderId === session.user.id,
      from: m.senderId === thread.buyerId ? "acquirente" : m.senderId ? "venditore" : "sistema",
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

const Body = z.object({ body: z.string().min(1).max(2000) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await params;
  const thread = await assertAccess(id, session.user.id);
  if (!thread) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { body, wasRedacted } = redactContactInfo(parsed.data.body);

  const message = await prisma.chatMessage.create({
    data: { threadId: id, senderId: session.user.id, body, wasRedacted },
  });

  return NextResponse.json({ message: { ...message, wasRedacted } });
}
