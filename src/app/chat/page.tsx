import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/TopBar";

export default async function ChatListPage() {
  const session = await auth();
  if (!session) redirect("/accesso?callbackUrl=/chat");

  const threads = await prisma.chatThread.findMany({
    where: { OR: [{ buyerId: session.user.id }, { listing: { sellerId: session.user.id } }] },
    include: {
      listing: { include: { seller: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-dvh bg-bg pt-[54px] pb-8">
      <TopBar />
      <div className="border-b border-divider px-4 pt-3 pb-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[30px] leading-none">Chat</h2>
        </div>
        <p className="mt-2.5 text-xs leading-snug text-neutral-700">
          Nessun numero di telefono circola qui: numeri ed email vengono nascosti automaticamente.
        </p>
      </div>

      {threads.length === 0 ? (
        <div className="px-4 pt-8 text-center">
          <div className="font-display text-2xl leading-tight">Nessuna conversazione</div>
          <div className="mt-1.75 text-[12.5px] text-neutral-700">
            Scrivi al proprietario da un annuncio per iniziare.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-px bg-divider">
          {threads.map((t) => {
            const isSeller = t.listing?.sellerId === session.user.id;
            const who = t.kind === "SUPPORT" ? "Assistenza Giàcasa" : isSeller ? `Acquirente #${t.buyerId.slice(-4).toUpperCase()}` : (t.listing?.seller.name ?? "Venditore");
            const last = t.messages[0];
            return (
              <Link key={t.id} href={`/chat/${t.id}`} className="flex gap-2.75 bg-surface px-4 py-3.5 hover:bg-blue-100">
                <div
                  className={`flex h-9.5 w-9.5 flex-none items-center justify-center rounded-full font-semibold ${
                    t.kind === "SUPPORT" ? "bg-accent-600 text-white" : "bg-blue-200 text-blue-800"
                  }`}
                >
                  {who.replace(/[^A-Za-z#]/g, "").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-heading text-[15.5px] font-semibold tracking-[0.01em]">{who}</div>
                  {t.listing && <div className="mt-0.75 text-[11px] text-blue-700">{t.listing.addressLine}</div>}
                  <div className="mt-1 truncate text-[12.5px] text-neutral-700">
                    {last ? last.body : "Nessun messaggio ancora."}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="px-4 pt-6">
        <div className="border-l-4 border-blue-600 bg-blue-100 p-3.25">
          <div className="mb-1.5 font-label text-[9px] font-semibold tracking-[0.11em] text-blue-700">
            COME PROTEGGIAMO I CONTATTI
          </div>
          <div className="text-xs leading-snug text-neutral-800">
            Numeri ed email non compaiono mai in chat: se provi a scriverli, li nascondiamo.
          </div>
        </div>
      </div>
    </div>
  );
}
