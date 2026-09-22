"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { id: "cerca", label: "CERCA", href: "/ricerca" },
  { id: "mappa", label: "MAPPA", href: "/ricerca?view=mappa" },
  { id: "salvati", label: "SALVATI", href: "/salvati" },
  { id: "profilo", label: "PROFILO", href: "/menu" },
] as const;

function Mark({ id, active }: { id: string; active: boolean }) {
  const color = active ? "currentColor" : "currentColor";
  if (id === "cerca") return <div className="absolute inset-1 rounded-full border-[1.5px]" style={{ borderColor: color }} />;
  if (id === "mappa") return <div className="absolute inset-y-0 left-1/2 w-[1.5px]" style={{ background: color }} />;
  if (id === "salvati") return <div className="absolute inset-x-1 top-1/2 h-[1.5px]" style={{ background: color }} />;
  return <div className="absolute inset-x-1 bottom-[3px] h-1.5 border-[1.5px] border-b-0" style={{ borderColor: color }} />;
}

export function BottomTabs() {
  const pathname = usePathname();
  return (
    <div className="sticky bottom-0 z-30 grid grid-cols-4 border-t border-divider bg-bg pt-2.5 pb-6">
      {TABS.map((t) => {
        const active =
          t.id === "cerca" ? pathname === "/ricerca" : t.id === "profilo" ? pathname === "/menu" : false;
        return (
          <Link
            key={t.id}
            href={t.href}
            className={`flex flex-col items-center gap-1.5 ${active ? "text-accent-700" : "text-neutral-500"}`}
          >
            <div className="relative h-[18px] w-[18px] border-[1.5px] border-current">
              <Mark id={t.id} active={active} />
            </div>
            <span className="font-label text-[9.5px] font-semibold tracking-[0.08em]">{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
