import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChatThreadClient } from "@/components/chat/ChatThreadClient";

export default async function ChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect(`/accesso?callbackUrl=/chat/${id}`);

  const thread = await prisma.chatThread.findUnique({
    where: { id },
    include: { listing: { include: { seller: true } }, messages: { orderBy: { createdAt: "asc" }, include: { sender: true } } },
  });
  if (!thread) notFound();

  const isSeller = thread.listing?.sellerId === session.user.id;
  const allowed = thread.buyerId === session.user.id || isSeller;
  if (!allowed) redirect("/chat");

  const who =
    thread.kind === "SUPPORT"
      ? "Assistenza Giàcasa"
      : isSeller
        ? `Acquirente #${thread.buyerId.slice(-4).toUpperCase()}`
        : (thread.listing?.seller.name ?? "Venditore");

  return (
    <ChatThreadClient
      threadId={thread.id}
      who={who}
      sub={thread.listing ? `${thread.listing.addressLine}, ${thread.listing.city}` : "Assistenza"}
      initialMessages={thread.messages.map((m) => ({
        id: m.id,
        body: m.body,
        isSystem: m.isSystem,
        mine: m.senderId === session.user.id,
        from: m.senderId === thread.buyerId ? "acquirente" : m.senderId ? "venditore" : "sistema",
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}
