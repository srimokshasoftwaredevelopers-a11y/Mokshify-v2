"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icons";

type Item = { href: string; label: string; icon: IconName; owner?: boolean };
export const NAV: Item[] = [
  { href: "/today", label: "Today", icon: "today" },
  { href: "/leads", label: "Leads", icon: "leads" },
  { href: "/pipeline", label: "Pipeline", icon: "pipeline" },
  { href: "/clients", label: "Clients", icon: "clients" },
  { href: "/projects", label: "Projects", icon: "projects" },
  { href: "/renewals", label: "Renewals", icon: "renewals" },
  { href: "/reports", label: "Reports", icon: "reports" },
  { href: "/settings", label: "Settings", icon: "settings", owner: true },
];
const TABS = ["/today", "/leads", "/pipeline", "/clients"];
const MORE = ["/more", "/projects", "/renewals", "/reports", "/settings"];

const active = (path: string, href: string) => path === href || path.startsWith(href + "/");

export function SideNav({ isOwner }: { isOwner: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="grid gap-0.5 px-3">
      {NAV.filter(i => !i.owner || isOwner).map(i => {
        const on = active(path, i.href) || (i.href === "/leads" && path.startsWith("/deals"));
        return (
          <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined}
            className={`relative flex min-h-11 items-center gap-3 rounded-[6px] px-3 text-[15px] transition-colors duration-150 ${on ? "bg-oxblood-700 text-paper" : "text-paper/75 hover:bg-white/5 hover:text-paper"}`}>
            {on && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 rounded bg-brass" />}
            <Icon name={i.icon} size={18} />
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function TabBar() {
  const path = usePathname();
  const tabs = [...NAV.filter(i => TABS.includes(i.href)), { href: "/more", label: "More", icon: "more" as const }];
  return (
    <nav aria-label="Main" className="on-dark fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-oxblood-900 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid grid-cols-5">
        {tabs.map(t => {
          const on = t.href === "/more" ? MORE.some(h => active(path, h)) : active(path, t.href) || (t.href === "/pipeline" && path.startsWith("/deals"));
          return (
            <li key={t.href}>
              <Link href={t.href} aria-current={on ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium ${on ? "text-paper" : "text-paper/65"}`}>
                <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors duration-150 ${on ? "bg-oxblood-700" : ""}`}><Icon name={t.icon} size={20} /></span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
