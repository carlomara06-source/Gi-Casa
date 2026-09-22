import Link from "next/link";
import { ReactNode } from "react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="relative h-[17px] w-[17px] bg-accent-600">
        <div className="absolute inset-y-0 left-1/2 w-[1.5px] bg-bg" />
      </div>
      <span className="font-display text-[22px] leading-none tracking-[-0.01em]">Giàcasa</span>
    </Link>
  );
}

export function TopBar({ right, sticky = true }: { right?: ReactNode; sticky?: boolean }) {
  return (
    <div
      className={`${sticky ? "sticky top-0 z-30" : ""} flex items-center justify-between bg-bg px-4 py-2.5 border-b border-divider`}
    >
      <Logo />
      {right}
    </div>
  );
}
