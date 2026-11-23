import Link from "next/link";
import { signOut } from "@/app/(app)/actions";
import type { SessionUser } from "@/lib/auth";
import { Icon } from "./icons";
import { SideNav, TabBar } from "./Nav";

function Brand() {
  return (
    <Link href="/today" className="flex items-center gap-2.5 text-paper no-underline">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/mark-paper-80.png" alt="" width={32} height={32} />
      <span className="text-[15px] font-semibold leading-none">Mokshify <span className="font-normal text-paper/70">Desk</span></span>
    </Link>
  );
}

export function Shell({ user, children, quickAdd }: { user: SessionUser; children: React.ReactNode; quickAdd?: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-[6px] focus:bg-paper focus:px-4 focus:py-3">Skip to content</a>

      <aside className="on-dark sticky top-0 hidden h-dvh flex-col gap-6 bg-oxblood-900 py-5 lg:flex">
        <div className="px-6"><Brand /></div>
        <SideNav isOwner={user.role === "owner"} />
        <div className="mt-auto border-t border-white/10 px-6 pt-4 text-paper">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="label !text-paper/60">{user.role}</p>
          <form action={signOut} className="mt-2 -ml-3">
            <button className="btn btn-quiet btn-sm !text-paper/80 hover:!bg-white/5"><Icon name="logout" size={16} />Sign out</button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="on-dark sticky top-0 z-20 flex h-14 items-center justify-between bg-oxblood-900 px-4 lg:hidden">
          <Brand />
          <span className="label !text-paper/60">{user.name.split(" ")[0]}</span>
        </header>
        <main id="main" className="mx-auto w-full max-w-[90rem] px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-16 lg:pt-8">{children}</main>
      </div>

      <TabBar />
      {quickAdd}
    </div>
  );
}
