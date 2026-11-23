import { fmtDateTime } from "@/lib/format";
import { Icon, type IconName } from "./icons";

const ICON: Record<string, IconName> = { call: "phone", whatsapp: "whatsapp", email: "mail", meeting: "meeting", note: "note", stage_change: "pipeline", system: "alert" };
const LABEL: Record<string, string> = { call: "Call", whatsapp: "WhatsApp", email: "Email", meeting: "Meeting", note: "Note", stage_change: "Stage", system: "System" };

type Item = { id: string; kind: string; body: string | null; occurredAt: Date; userName: string | null };

/** one timeline of every activity, newest first */
export function Timeline({ items }: { items: Item[] }) {
  if (!items.length) return <p className="rounded-[6px] border border-dashed border-rule px-4 py-6 text-center text-sm text-ink-2">Nothing logged yet. Use the buttons above after each call, message or meeting.</p>;
  return (
    <ol className="relative grid gap-0 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-rule">
      {items.map(a => (
        <li key={a.id} className="relative flex gap-3 py-2.5">
          <span className={`relative z-[1] grid h-8 w-8 shrink-0 place-items-center rounded-full border border-rule bg-paper ${a.kind === "stage_change" ? "text-brass" : "text-ink-2"}`}><Icon name={ICON[a.kind] ?? "note"} size={15} /></span>
          <div className="min-w-0 pt-1">
            <p className="text-sm"><span className="font-medium">{LABEL[a.kind] ?? a.kind}</span>{a.userName && <span className="text-ink-2"> · {a.userName}</span>} <span className="mono text-xs text-ink-2">· {fmtDateTime(a.occurredAt)}</span></p>
            {a.body && <p className="mt-0.5 whitespace-pre-line break-words text-[15px]">{a.body}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
