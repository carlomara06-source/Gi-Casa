import { Suspense } from "react";
import { LoginClient } from "@/components/LoginClient";

export default function AccessoPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}
