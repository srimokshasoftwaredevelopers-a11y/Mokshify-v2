import { SkeletonRows } from "@/components/ui";

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="skeleton mb-6 h-9 w-48" />
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-20" />)}
      </div>
      <SkeletonRows rows={5} />
    </div>
  );
}
