import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decorateListing } from "@/lib/listings";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { PropertyCard } from "@/components/search/PropertyCard";

export default async function SalvatiPage() {
  const session = await auth();
  if (!session) redirect("/accesso?callbackUrl=/salvati");

  const saved = await prisma.savedListing.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { listing: { include: { seller: true } } },
  });

  return (
    <div className="min-h-dvh bg-bg pt-[54px]">
      <TopBar />
      <div className="px-4 pt-3 pb-3.5">
        <h2 className="font-display text-[30px] leading-none">Salvati</h2>
      </div>

      {saved.length === 0 ? (
        <div className="px-4 pt-6 text-center">
          <div className="font-display text-2xl leading-tight">Nessun immobile salvato</div>
          <div className="mt-1.75 text-[12.5px] text-neutral-700">
            Tocca il cuore su un annuncio per ritrovarlo qui.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-7 px-4 pb-7">
          {saved.map((s) => (
            <PropertyCard key={s.id} p={decorateListing(s.listing)} />
          ))}
        </div>
      )}

      <div className="h-19" />
      <BottomTabs />
    </div>
  );
}
