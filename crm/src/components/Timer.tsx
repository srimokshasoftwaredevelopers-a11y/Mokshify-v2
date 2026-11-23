"use client";
import { useEffect, useState } from "react";
import { fmtDuration } from "@/lib/format";
import { timerColour } from "@/lib/rules";
import { Icon } from "./icons";

const TONE = { green: "tone-success", amber: "tone-warning", red: "tone-danger" } as const;
const WORD = { green: "Under 5 min", amber: "Under an hour", red: "Over an hour" } as const;

/** time since the enquiry arrived; stops at the first logged reply and then shows the stored response time */
export function Timer({ since, repliedSeconds }: { since: string; repliedSeconds?: number | null }) {
  const start = new Date(since).getTime();
  const [now, setNow] = useState(() => Date.now());
  const replied = repliedSeconds !== null && repliedSeconds !== undefined;
  useEffect(() => {
    if (replied) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [replied]);

  if (replied) {
    const c = timerColour(repliedSeconds);
    return (
      <span className={`badge ${TONE[c]}`} title="Time to first reply">
        Replied in <span className="mono">{fmtDuration(repliedSeconds)}</span>
      </span>
    );
  }
  const elapsed = Math.max(0, (now - start) / 1000);
  const c = timerColour(elapsed);
  return (
    <span role="timer" className={`badge ${TONE[c]} !py-1`} aria-label={`Waiting ${fmtDuration(elapsed)} for a first reply — ${WORD[c].toLowerCase()}`}>
      <Icon name="clock" size={14} />
      <span className="mono font-semibold" suppressHydrationWarning>{fmtDuration(elapsed)}</span>
      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">· {WORD[c]}</span>
    </span>
  );
}
