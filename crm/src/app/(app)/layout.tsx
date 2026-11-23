import { headers } from "next/headers";
import { forbidden } from "next/navigation";
import { QuickAdd } from "@/components/QuickAdd";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { getSources } from "@/server/queries";

/* owner-only areas. Refused here, before anything streams, so a staff session gets a real 403
   status (each page also calls requireOwner() itself). */
const OWNER_ONLY = [/^\/settings(\/|$)/];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const path = (await headers()).get("x-desk-path") ?? "";
  if (user.role !== "owner" && OWNER_ONLY.some(r => r.test(path))) forbidden();
  const sources = await getSources();
  return <Shell user={user} quickAdd={<QuickAdd sources={sources} />}>{children}</Shell>;
}
