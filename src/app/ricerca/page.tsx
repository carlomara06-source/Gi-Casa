import { Suspense } from "react";
import { findListings, decorateListing } from "@/lib/listings";
import { SearchApp } from "@/components/search/SearchApp";

export const dynamic = "force-dynamic";

export default async function RicercaPage() {
  const all = await findListings({});
  return (
    <Suspense>
      <SearchApp initialAll={all.map(decorateListing)} />
    </Suspense>
  );
}
