import { Suspense } from "react";
import { AbbonamentiClient } from "@/components/sell/AbbonamentiClient";

export default function AbbonamentiPage() {
  return (
    <Suspense>
      <AbbonamentiClient />
    </Suspense>
  );
}
