import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/TopBar";

export default async function MenuPage() {
  const session = await auth();

  let sellerListing: { id: string; addressLine: string; status: string } | null = null;
  let proposalCount = 0;
  let chatCount = 0;

  if (session) {
    const listing = await prisma.listing.findFirst({
      where: { sellerId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    sellerListing = listing ? { id: listing.id, addressLine: listing.addressLine, status: listing.status } : null;

    [proposalCount, chatCount] = await Promise.all([
      prisma.proposal.count({ where: { buyerId: session.user.id, status: "PENDING" } }),
      prisma.chatThread.count({ where: { OR: [{ buyerId: session.user.id }, { agentId: session.user.id }] } }),
    ]);
  }

  const groups: {
    title: string;
    items: { label: string; note: string; href: string; badge?: string }[];
  }[] = [];

  if (sellerListing) {
    groups.push({
      title: "I MIEI ANNUNCI",
      items: [
        { label: "Gestionale", note: "Dati, documenti, visite e conti", href: `/venditore/gestionale/${sellerListing.id}` },
        { label: "Proposte ricevute", note: "Accetta o rifiuta in app", href: "/venditore" },
        { label: "Gestione piano", note: "Pausa, downgrade o upgrade", href: "/venditore" },
        {
          label: "Mandato in esclusiva",
          note: sellerListing.status === "PUBLISHED" ? "Firmato e attivo" : "Da firmare per pubblicare",
          href: `/venditore/mandato/${sellerListing.id}`,
        },
      ],
    });
  }

  groups.push({
    title: "STO CERCANDO CASA",
    items: [
      { label: "Ricerca e mappa", note: "Tariffa fissa su ogni annuncio", href: "/ricerca" },
      { label: "Filtri avanzati", note: "Prezzo, tariffa, piano, classe, dotazioni", href: "/ricerca" },
      { label: "Chat", note: "Conversazioni con venditori e agente", href: "/chat", badge: chatCount > 0 ? String(chatCount) : undefined },
      { label: "Le mie proposte", note: "Firmate con FEA, in attesa di risposta", href: "/ricerca", badge: proposalCount > 0 ? String(proposalCount) : undefined },
    ],
  });

  groups.push({
    title: "STO VENDENDO",
    items: [
      { label: "Pubblica gratis", note: "Tre passi, 4 minuti, 0% di provvigione", href: "/vendi" },
      { label: "Abbonamenti e servizi", note: "Free, Visibility, Smart Agent, Concierge", href: "/abbonamenti" },
      { label: "Come ci vedono sui portali", note: "Immobiliare.it, Idealista, Casa.it", href: sellerListing ? `/annunci/${sellerListing.id}/portali` : "/vendi" },
    ],
  });

  groups.push({
    title: "STRUMENTI",
    items: [
      { label: "Valutazione gratuita IA", note: "Stima in 30 secondi, poi un agente", href: "/valutazione", badge: "GRATIS" },
      { label: "Calcolo tariffa acquirente", note: "I sei scaglioni", href: "/ricerca" },
    ],
  });

  groups.push({
    title: "ACCOUNT",
    items: session
      ? [
          { label: "Numero verificato", note: session.user.phone, href: "/menu" },
          { label: "Assistenza", note: "Rispondiamo entro 2 ore", href: "/chat" },
        ]
      : [{ label: "Accedi", note: "Con numero di telefono e OTP", href: "/accesso?callbackUrl=/menu" }],
  });

  return (
    <div className="min-h-dvh bg-blue-900 pt-[54px] text-white">
      <div className="flex items-center justify-between px-4 pt-3">
        <Logo />
      </div>

      <div className="border-b border-white/20 px-4 pt-5.5 pb-4.5">
        <div className="flex items-center gap-3">
          <div className="flex h-11.5 w-11.5 flex-none items-center justify-center rounded-full bg-blue-200 text-lg font-semibold text-blue-800">
            {(session?.user.name ?? session?.user.phone ?? "?").charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-display text-[26px] leading-none">{session?.user.name ?? "Ospite"}</div>
            <div className="mt-1.25 font-label text-[9.5px] font-semibold tracking-[0.11em] text-blue-300">
              {sellerListing ? "VENDITRICE · 1 ANNUNCIO ATTIVO" : session ? "ACQUIRENTE" : "NON HAI ANCORA FATTO ACCESSO"}
            </div>
          </div>
        </div>
        <div className="mt-3.5 flex gap-2">
          <Link href="/vendi" className="flex-1 bg-accent-600 py-3 text-center font-heading text-sm font-semibold tracking-[0.05em] text-white uppercase hover:bg-accent-700">
            Pubblica casa
          </Link>
          <Link href="/valutazione" className="flex-1 border border-blue-400 py-3 text-center font-heading text-sm font-semibold tracking-[0.05em] text-white uppercase hover:bg-blue-800">
            Valuta gratis
          </Link>
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.title} className="px-4 pt-5 pb-1.5">
          <div className="mb-1 font-label text-[9.5px] font-semibold tracking-[0.14em] text-blue-300">{g.title}</div>
          <div className="flex flex-col gap-px bg-white/16">
            {g.items.map((it, i) => (
              <Link key={it.label} href={it.href} className="flex items-center gap-3 bg-blue-900 py-3.5">
                <div
                  className={`h-5.5 w-5.5 flex-none border-[1.5px] border-blue-400 ${
                    i % 4 === 1 ? "rounded-full" : i % 4 === 2 ? "rotate-45" : i % 4 === 3 ? "border-l-[5px]" : ""
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-heading text-[17px] font-semibold tracking-[0.01em]">{it.label}</div>
                  <div className="mt-0.75 text-[11.5px] text-blue-200">{it.note}</div>
                </div>
                {it.badge && (
                  <div className="flex-none bg-accent-600 px-1.75 py-1.25 font-label text-[9px] font-semibold tracking-[0.1em] text-white">
                    {it.badge}
                  </div>
                )}
                <div className="flex-none font-body text-base text-blue-300">›</div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      <div className="px-4 pt-5">
        <div className="bg-accent-600 p-3.75">
          <div className="mb-1.75 font-label text-[9.5px] font-semibold tracking-[0.13em] text-white/80">
            SEI UN AGENTE IMMOBILIARE?
          </div>
          <div className="font-display text-[25px] leading-[1.1]">
            Lavora con noi sul territorio: incarichi in zona, compensi al rogito.
          </div>
        </div>
      </div>

      <div className="px-4 pt-5.5 pb-8.5">
        <div className="flex flex-wrap gap-x-4 gap-y-2.5 text-[11.5px] text-blue-200">
          {["Privacy", "Termini", "Trasparenza tariffe", "Cookie"].map((l) => (
            <span key={l} className="underline underline-offset-3">{l}</span>
          ))}
        </div>
        <div className="mt-4 font-label text-[9.5px] leading-relaxed font-semibold tracking-[0.1em] text-blue-400">
          GIÀCASA SRL · AGENZIA IMMOBILIARE ABILITATA · REA MI-000000
        </div>
      </div>
    </div>
  );
}
