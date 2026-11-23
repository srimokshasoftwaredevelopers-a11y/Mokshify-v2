import { QuickAdd } from "@/components/QuickAdd";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { getSources } from "@/server/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const sources = await getSources();
  return <Shell user={user} quickAdd={<QuickAdd sources={sources} />}>{children}</Shell>;
}
