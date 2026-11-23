import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/(app)/actions";
import { Icon, type IconName } from "@/components/icons";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "More" };

export default async function MorePage() {
  const user = await requireUser();
  const items: { href: string; label: string; icon: IconName; note: string }[] = [
    { href: "/projects", label: "Projects", icon: "projects", note: "Delivery, payments and balances" },
    { href: "/renewals", label: "Renewals", icon: "renewals", note: "Domains, hosting, SSL, maintenance" },
    { href: "/reports", label: "Reports", icon: "reports", note: "Sources, funnel, reply time, revenue" },
    ...(user.role === "owner" ? [{ href: "/settings", label: "Settings", icon: "settings" as const, note: "Users, templates, data" }] : []),
  ];
  return (
    <>
      <h1 className="mb-5 text-[26px]">More</h1>
      <ul className="card divide-y divide-rule">
        {items.map(i => (
          <li key={i.href}><Link href={i.href} className="flex min-h-16 items-center gap-3 px-4 no-underline hover:bg-ink/[.03]">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-limestone"><Icon name={i.icon} /></span>
            <span className="flex-1"><span className="block font-medium">{i.label}</span><span className="block text-sm text-ink-2">{i.note}</span></span>
            <Icon name="arrow" size={18} className="text-ink-2" />
          </Link></li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-ink-2">Signed in as <span className="font-medium text-ink">{user.name}</span> ({user.role})</p>
        <form action={signOut}><button className="btn btn-ghost btn-sm"><Icon name="logout" size={16} />Sign out</button></form>
      </div>
    </>
  );
}
