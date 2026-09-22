import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eur } from "@/lib/pricing";
import { daysSince } from "@/lib/dates";
import { TopBar } from "@/components/TopBar";
import { ProposalsPanel } from "@/components/sell/ProposalsPanel";
import { PlanPanel } from "@/components/sell/PlanPanel";

export default async function VenditorePage() {
  const session = await auth();
  if (!session) redirect("/accesso?callbackUrl=/venditore");

  const listing = await prisma.listing.findFirst({
    where: { sellerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { subscription: true },
  });

  if (!listing) {
    return (
      <div className="min-h-dvh bg-bg pt-[54px]">
        <TopBar />
        <div className="px-4 pt-10 text-center">
          <h2 className="mb-2.5 font-display text-2xl">Nessun annuncio ancora</h2>
          <p className="mb-5 text-[13px] text-neutral-700">Pubblica la tua casa in tre passi, gratis.</p>
          <Link href="/vendi" className="inline-block bg-accent-600 px-5 py-3 font-heading text-sm font-semibold tracking-[0.05em] text-white uppercase hover:bg-accent-700">
            Pubblica gratis
          </Link>
        </div>
      </div>
    );
  }

  const daysOnline = listing.publishedAt ? daysSince(listing.publishedAt) : 0;

  const [visitCount, proposals] = await Promise.all([
    prisma.visit.count({ where: { listingId: listing.id } }),
    prisma.proposal.findMany({
      where: { listingId: listing.id },
      orderBy: { createdAt: "desc" },
      include: { buyer: true },
    }),
  ]);

  const MERCATO = listing.price;

  return (
    <div className="min-h-dvh bg-bg pt-[54px] pb-10">
      <TopBar
        right={
          <div className="h-2.25 w-2.25 rounded-full bg-accent-600" />
        }
      />

      <div className="flex items-center gap-2.5 px-4 pt-2.5">
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-blue-200 font-semibold text-blue-800">
          {(session.user.name ?? "V").charAt(0)}
        </div>
        <div>
          <div className="font-display text-[19px] leading-none">{session.user.name ?? "Venditore"}</div>
          <div className="mt-0.75 font-label text-[9.5px] font-semibold tracking-[0.1em] text-neutral-600">
            VENDITRICE · {listing.city.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4.5">
        <div className="blueprint flex gap-3 bg-surface p-3">
          <div className="h-[70px] w-[86px] flex-none bg-neutral-200" />
          <div className="min-w-0">
            <div className="font-display text-[21px] leading-[1.05]">{listing.addressLine}</div>
            <div className="my-0.5 text-[11.5px] text-neutral-700">
              {listing.mq} m² · {listing.locali} locali · {eur(listing.price)}
            </div>
            <span className="mt-1.5 inline-block bg-blue-200 px-1.75 py-1.25 font-label text-[9.5px] font-semibold tracking-[0.1em] text-blue-800">
              {listing.status === "PUBLISHED" ? `ONLINE DA ${daysOnline} GIORNI` : listing.status === "PAUSED" ? "IN PAUSA" : "BOZZA"}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="grid grid-cols-3 gap-px border border-divider bg-divider">
          {[
            { n: String(listing.views), k: "VISUALIZZAZIONI" },
            { n: String(visitCount), k: "VISITE IN AGENDA" },
            { n: String(proposals.length), k: "PROPOSTE RICEVUTE" },
          ].map((s) => (
            <div key={s.k} className="bg-bg p-2.5">
              <div className="font-display text-[30px] leading-[0.9]">{s.n}</div>
              <div className="mt-1.5 font-label text-[9px] font-semibold tracking-[0.09em] text-neutral-600">{s.k}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-6.5">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-display text-2xl">Proposte ricevute</h3>
          <span className="font-label text-[10px] font-semibold text-neutral-600">
            {proposals.filter((p) => p.status === "PENDING").length} DA VALUTARE
          </span>
        </div>
        <ProposalsPanel
          marketValue={MERCATO}
          proposals={proposals.map((p) => ({
            id: p.id,
            amount: p.amount,
            depositCents: p.depositCents,
            depositPct: p.depositPct,
            who: `ACQUIRENTE #${p.buyerId.slice(-4).toUpperCase()}`,
            status: p.status,
            note: `${p.conditions.length} condizioni sospensive · firmata con FEA il ${new Date(p.signedAt ?? p.createdAt).toLocaleDateString("it-IT")}`,
          }))}
        />
      </div>

      <div className="px-4 pt-7">
        <h3 className="mb-1 font-display text-2xl">Gestione piano annuncio</h3>
        <p className="mb-1.5 text-[12.5px] text-neutral-700">
          Settimanale, senza vincoli. La provvigione resta 0% in tutti i piani.
        </p>
        <PlanPanel
          listingId={listing.id}
          currentPlan={listing.subscription?.plan ?? "FREE"}
          paused={listing.status === "PAUSED"}
        />
      </div>

      <div className="px-4 pt-7">
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/venditore/gestionale/${listing.id}`} className="border border-divider py-3 text-center font-heading text-[13px] font-semibold tracking-[0.04em] text-neutral-800 uppercase hover:bg-accent-100">
            Gestionale
          </Link>
          <Link href="/chat" className="border border-divider py-3 text-center font-heading text-[13px] font-semibold tracking-[0.04em] text-neutral-800 uppercase hover:bg-accent-100">
            Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
