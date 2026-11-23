import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="card max-w-md p-8 text-center">
        <p className="label">404</p>
        <h1 className="mt-3 text-2xl">Nothing here.</h1>
        <p className="mt-2 text-ink-2">The record may have been deleted, or the link is wrong.</p>
        <Link className="btn btn-primary mt-6" href="/today">Back to Today</Link>
      </div>
    </main>
  );
}
