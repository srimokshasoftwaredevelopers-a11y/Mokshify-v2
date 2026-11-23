/* Light SVG charts, rendered on the server. Each has a text title for screen readers and sits
   next to its table view; colours always come with labels. */
import { rupeesShort } from "@/lib/format";

/** horizontal bars: categories and counts */
export function Bars({ rows, label, value, title, money }: { rows: Record<string, unknown>[]; label: string; value: string; title: string; money?: boolean }) {
  const max = Math.max(1, ...rows.map(r => Number(r[value]) || 0));
  if (!rows.length) return <p className="py-6 text-center text-sm text-ink-2">Nothing in this range.</p>;
  return (
    <ul className="grid gap-2" aria-label={title}>
      {rows.map((r, i) => {
        const v = Number(r[value]) || 0;
        return (
          <li key={i} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] items-center gap-3 text-sm">
            <span className="truncate" title={String(r[label])}>{String(r[label])}</span>
            <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-3 w-full" aria-hidden="true">
              <rect width="100" height="10" rx="2" className="fill-ink/[.06]" />
              <rect width={Math.max(1.5, (v / max) * 100)} height="10" rx="2" className="fill-oxblood-700" />
            </svg>
            <span className="mono w-14 text-right">{money ? rupeesShort(v) : v}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** vertical columns per period, one or two series (the second in brass) */
export function Columns({ rows, x, series, title, money }: { rows: Record<string, unknown>[]; x: string; series: { key: string; label: string; tone: "primary" | "brass" | "danger" }[]; title: string; money?: boolean }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-ink-2">Nothing in this range.</p>;
  const max = Math.max(1, ...rows.flatMap(r => series.map(s => Number(r[s.key]) || 0)));
  const W = 100, H = 48, gw = W / rows.length, bw = (gw * 0.7) / series.length;
  const fill = { primary: "fill-oxblood-700", brass: "fill-brass", danger: "fill-danger" } as const;
  return (
    <figure className="grid gap-2">
      <svg viewBox={`0 0 ${W} ${H + 8}`} className="h-48 w-full" role="img" aria-label={title} preserveAspectRatio="none">
        <title>{title}</title>
        <line x1="0" y1={H} x2={W} y2={H} className="stroke-ink/20" strokeWidth="0.3" />
        {rows.map((r, i) => series.map((s, j) => {
          const v = Number(r[s.key]) || 0, h = (v / max) * (H - 2);
          return <rect key={`${i}-${j}`} x={i * gw + gw * 0.15 + j * bw} y={H - h} width={bw * 0.92} height={h} rx="0.6" className={fill[s.tone]} />;
        }))}
      </svg>
      <div className="flex justify-between gap-1 text-[11px] text-ink-2" aria-hidden="true">{rows.map((r, i) => <span key={i} className="mono flex-1 truncate text-center">{String(r[x]).slice(2)}</span>)}</div>
      <figcaption className="flex flex-wrap gap-4 text-xs text-ink-2">
        {series.map(s => <span key={s.key} className="inline-flex items-center gap-1.5"><svg width="10" height="10" aria-hidden="true"><rect width="10" height="10" rx="2" className={fill[s.tone]} /></svg>{s.label}{money ? "" : ""}</span>)}
        <span className="ml-auto mono">max {money ? rupeesShort(max) : max}</span>
      </figcaption>
    </figure>
  );
}

/** a trend line with dots (e.g. reply time per week); lower is better is said in the title */
export function Trend({ rows, x, y, title, format }: { rows: Record<string, unknown>[]; x: string; y: string; title: string; format: (n: number) => string }) {
  const pts = rows.filter(r => r[y] !== null && r[y] !== undefined);
  if (!pts.length) return <p className="py-6 text-center text-sm text-ink-2">No replies logged in this range.</p>;
  const max = Math.max(1, ...pts.map(r => Number(r[y])));
  const W = 100, H = 40, step = pts.length > 1 ? W / (pts.length - 1) : 0;
  const xy = pts.map((r, i) => [pts.length > 1 ? i * step : W / 2, H - (Number(r[y]) / max) * (H - 4)] as const);
  return (
    <figure className="grid gap-2">
      <svg viewBox={`-2 -2 ${W + 4} ${H + 6}`} className="h-40 w-full" role="img" aria-label={title} preserveAspectRatio="none">
        <title>{title}</title>
        <line x1="0" y1={H} x2={W} y2={H} className="stroke-ink/20" strokeWidth="0.3" />
        <polyline points={xy.map(p => p.join(",")).join(" ")} fill="none" className="stroke-oxblood-700" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        {xy.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="1.2" className="fill-brass" />)}
      </svg>
      <figcaption className="flex justify-between text-xs text-ink-2"><span className="mono">{String(pts[0]![x])}</span><span>peak {format(max)}</span><span className="mono">{String(pts[pts.length - 1]![x])}</span></figcaption>
    </figure>
  );
}

/** the table view every chart has */
export function DataTable({ rows, columns }: { rows: Record<string, unknown>[]; columns: { key: string; label: string; format?: (v: unknown) => string; align?: "right" }[] }) {
  if (!rows.length) return <p className="text-sm text-ink-2">No rows.</p>;
  return (
    <div className="overflow-x-auto"><table className="table">
      <thead><tr>{columns.map(c => <th key={c.key} className={c.align === "right" ? "text-right" : ""}>{c.label}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{columns.map(c => <td key={c.key} className={c.align === "right" ? "mono text-right" : ""}>{c.format ? c.format(r[c.key]) : String(r[c.key] ?? "—")}</td>)}</tr>)}</tbody>
    </table></div>
  );
}
