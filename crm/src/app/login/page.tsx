import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await currentUser()) redirect("/today");
  return (
    <main className="on-dark relative grid min-h-dvh place-items-center overflow-hidden bg-oxblood-900 px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-1/4 -top-1/3 aspect-square w-[60rem] max-w-[140vw] rounded-full bg-[radial-gradient(closest-side,rgb(74_20_34/.95),transparent)]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3 text-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/mark-paper-80.png" alt="" width={40} height={40} />
          <div>
            <p className="text-lg font-semibold leading-tight">Mokshify Desk</p>
            <p className="label !text-paper/70">Every enquiry, answered</p>
          </div>
        </div>
        <div className="card p-6 [--focus-ring:var(--color-ink)]">
          <h1 className="mb-5 text-xl">Sign in</h1>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-paper/70">No account? Ask the owner to add you.</p>
      </div>
    </main>
  );
}
