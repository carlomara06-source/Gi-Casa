import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PublishWizard } from "@/components/sell/PublishWizard";

export default async function VendiPage() {
  const session = await auth();
  if (!session) redirect("/accesso?callbackUrl=/vendi");
  return <PublishWizard />;
}
