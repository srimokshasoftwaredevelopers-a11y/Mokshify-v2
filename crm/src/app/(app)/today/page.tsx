import type { Metadata } from "next";
import { PageHeader, EmptyState } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Today" sub={`Signed in as ${user.name}.`} />
      <EmptyState icon="today" title="The work queue arrives in Phase 2." body="Reply now, follow-ups, waiting on the client, money and renewals." />
    </>
  );
}
