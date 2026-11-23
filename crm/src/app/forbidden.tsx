import Link from "next/link";

export default function Forbidden() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="card max-w-md p-8 text-center">
        <p className="label">403 · Owner only</p>
        <h1 className="mt-3 text-2xl">This part of Desk is for the owner.</h1>
        <p className="mt-2 text-ink-2">Exports, deletions and settings are kept to the owner account. Ask the owner if you need something from here.</p>
        <Link className="btn btn-primary mt-6" href="/today">Back to Today</Link>
      </div>
    </main>
  );
}
