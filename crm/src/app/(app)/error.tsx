"use client";
import { ErrorState } from "@/components/ui";

// error details stay on the server: the digest identifies the failure without exposing data
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg pt-10">
      <ErrorState
        message={error.digest ? `Reference ${error.digest}. Nothing was lost — try again.` : undefined}
        retry={<button className="btn btn-primary mt-2" onClick={reset}>Try again</button>}
      />
    </div>
  );
}
