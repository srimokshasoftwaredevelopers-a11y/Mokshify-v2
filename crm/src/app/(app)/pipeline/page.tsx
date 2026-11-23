import type { Metadata } from "next";
import { NewDeal } from "@/components/NewDeal";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { rupeesShort } from "@/lib/format";
import { isOpen, type Stage } from "@/lib/rules";
import { boardDeals } from "@/server/deals";
import { getLostReasons } from "@/server/queries";
import { Board } from "./Board";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  await requireUser();
  const [deals, lostReasons] = await Promise.all([boardDeals(), getLostReasons()]);
  const open = deals.filter(d => isOpen(d.stage as Stage));
  return (
    <>
      <PageHeader title="Pipeline" sub={`${open.length} open · ${rupeesShort(open.reduce((s, d) => s + d.value, 0))} in play`} actions={<NewDeal />} />
      {deals.length ? (
        <Board lostReasons={lostReasons} deals={deals.map(d => ({ id: d.id, title: d.title, stage: d.stage, value: d.value, nextAction: d.nextAction, nextActionDate: d.nextActionDate, who: d.who, ownerName: d.ownerName, stale: d.stale, idleDays: d.idleDays, lostReason: d.lostReason }))} />
      ) : <EmptyState icon="pipeline" title="No deals yet." body="Convert a lead to a deal from its page, or start one here." action={<NewDeal />} />}
    </>
  );
}
