import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Placeholder } from "@/components/ui/Placeholder";
import type { DecoratedListing } from "@/lib/listings";

export function PropertyCard({ p }: { p: DecoratedListing }) {
  return (
    <Link href={`/annunci/${p.id}`}>
      <Card className="cursor-pointer">
        <div className="relative h-[186px] border-b border-divider">
          <Placeholder label="foto" className="h-full w-full" />
          <div className="pointer-events-none absolute right-0 bottom-0 flex items-baseline gap-2 bg-accent-600 px-3.5 py-2 text-white">
            <span className="font-label text-[9px] font-semibold tracking-[0.13em] opacity-85">FLAT FEE</span>
            <span className="font-display text-[26px] leading-none">{p.feeLabel}</span>
          </div>
        </div>
        <div className="p-3.5">
          <div className="mb-1.5 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
            {p.city}
          </div>
          <div className="mb-1 font-display text-[25px] leading-[1.05] tracking-[-0.01em]">{p.title}</div>
          <div className="mb-3 text-[12.5px] text-neutral-700">{p.meta}</div>
          <div className="flex items-center gap-2.5 pb-2.5">
            <div className="flex h-6.5 w-6.5 flex-none items-center justify-center rounded-full bg-blue-200 text-[11px] font-semibold text-blue-800">
              {p.initial}
            </div>
            <div className="text-[11.5px] text-neutral-700">{p.owner}</div>
          </div>
          <div className="flex items-end justify-between gap-2.5 border-t border-divider pt-2.5">
            <div>
              <div className="font-display text-[27px] leading-none">{p.priceLabel}</div>
              <div className="text-[10.5px] text-neutral-600 line-through">agenzia 3%: {p.agencyLabel}</div>
            </div>
            <div className="text-right">
              <div className="inline-block bg-sun-200 px-1.5 py-1.5 font-label text-[11px] font-semibold text-sun-700">
                RISPARMI {p.savingLabel}
              </div>
              <div className="text-[10.5px] text-neutral-600">tariffa nota in anticipo</div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
