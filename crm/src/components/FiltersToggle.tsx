"use client";
import { useState } from "react";
import { Icon } from "./icons";

/** On phones the filter fields fold away behind one button (search stays visible); on desktop
    they are always shown. Starts open when any filter is active. */
export function FiltersToggle({ active, children }: { active: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(active > 0);
  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm justify-self-start lg:hidden" aria-expanded={open} aria-controls="more-filters" onClick={() => setOpen(o => !o)}>
        <Icon name="settings" size={16} />{open ? "Hide filters" : `Filters${active ? ` (${active})` : ""}`}
      </button>
      <div id="more-filters" className={`${open ? "grid" : "hidden"} gap-3 sm:col-span-2 sm:grid-cols-2 lg:contents`}>{children}</div>
    </>
  );
}
