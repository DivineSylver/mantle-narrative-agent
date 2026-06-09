"use client";

import { useWhales } from "@/lib/hooks";
import { formatUsd, shortAddr } from "@/lib/utils";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  ExternalLink,
  Filter as FilterIcon,
  Layers,
  Waves,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "./panel";
import { TimeAgo } from "./time-ago";

const EXPLORER = "https://sepolia.mantlescan.xyz";

const TYPE_META: Record<
  string,
  { icon: typeof Waves; color: string; badge: string }
> = {
  INFLOW: { icon: ArrowDownToLine, color: "text-[color:var(--color-gain)]", badge: "badge-gain" },
  OUTFLOW: { icon: ArrowUpFromLine, color: "text-[color:var(--color-loss)]", badge: "badge-loss" },
  SWAP: { icon: ArrowLeftRight, color: "text-[color:var(--color-text-secondary)]", badge: "badge" },
  BRIDGE_IN: { icon: Waves, color: "text-[color:var(--color-info)]", badge: "badge-info" },
  BRIDGE_OUT: { icon: Waves, color: "text-[color:var(--color-warning)]", badge: "badge-warn" },
  STAKE: { icon: Layers, color: "text-[color:var(--color-info)]", badge: "badge-info" },
};

const ALL_TYPES = Object.keys(TYPE_META);

export function WhaleTracker() {
  const { data: moves } = useWhales();
  const [enabled, setEnabled] = useState<Set<string>>(() => new Set(ALL_TYPES));
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    const onClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [filterOpen]);

  const filtered = useMemo(() => moves.filter((m) => enabled.has(m.type)), [moves, enabled]);

  const toggle = (t: string) =>
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const activeCount = enabled.size;
  const allActive = activeCount === ALL_TYPES.length;

  return (
    <Panel
      title="Whale Tracker"
      meta={<span className="label-meta">≥ $250k flows · last 4h</span>}
      action={
        <div ref={filterRef} className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            className={`btn-ghost ${
              !allActive ? "border-[color:var(--color-primary)] text-[color:var(--color-primary)]" : ""
            }`}
            aria-expanded={filterOpen}
            aria-haspopup="true"
          >
            <FilterIcon size={11} />
            FILTER
            {!allActive ? (
              <span className="badge badge-info ml-1">{activeCount}</span>
            ) : null}
          </button>
          {filterOpen ? (
            <div className="absolute right-0 top-full z-50 mt-1 w-44 border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-xl">
              <div className="flex items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2">
                <span className="label-meta">Move type</span>
                <button
                  type="button"
                  onClick={() =>
                    setEnabled(allActive ? new Set() : new Set(ALL_TYPES))
                  }
                  className="text-[10px] uppercase tracking-wider text-[color:var(--color-primary)] hover:underline"
                >
                  {allActive ? "Clear" : "All"}
                </button>
              </div>
              <ul className="py-1">
                {ALL_TYPES.map((t) => {
                  const t_meta = TYPE_META[t];
                  const Icon = t_meta.icon;
                  const on = enabled.has(t);
                  return (
                    <li key={t}>
                      <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-[color:var(--color-surface-hover)]">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(t)}
                          className="h-3 w-3 accent-[color:var(--color-primary)]"
                        />
                        <Icon size={11} className={t_meta.color} />
                        <span className="mono text-[11px]">{t.replace("_", " ")}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      }
      noPadding
    >
      <div className="grid grid-cols-12 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-[10px] uppercase tracking-wider text-[color:var(--color-text-tertiary)]">
        <div className="col-span-1">Type</div>
        <div className="col-span-4">Wallet</div>
        <div className="col-span-3">Asset</div>
        <div className="col-span-2 text-right">Value</div>
        <div className="col-span-2 text-right">Time</div>
      </div>
      <ul className="divide-y divide-[color:var(--color-border)]">
        {filtered.length === 0 ? (
          <li className="flex items-center justify-center px-4 py-8">
            <span className="label-meta">No moves match the active filter</span>
          </li>
        ) : null}
        {filtered.map((w) => {
          const t = TYPE_META[w.type];
          const Icon = t.icon;
          const href = `${EXPLORER}/address/${w.wallet}`;
          return (
            <li key={w.id}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="row-hover grid grid-cols-12 items-center gap-2 px-4 py-2.5 cursor-pointer"
                title="View wallet on Mantlescan"
              >
                <div className="col-span-1">
                  <Icon size={14} className={t.color} />
                </div>
                <div className="col-span-4 min-w-0">
                  <div className="mono text-[11px] truncate">{shortAddr(w.wallet)}</div>
                  <div className="text-[10px] text-[color:var(--color-text-tertiary)] truncate">
                    {w.walletLabel ?? "—"}
                  </div>
                </div>
                <div className="col-span-3 flex items-center gap-1.5">
                  <span className={`badge ${t.badge}`}>{w.type.replace("_", " ")}</span>
                  <span className="mono text-[11px]">{w.asset}</span>
                </div>
                <div className="col-span-2 mono tabular text-right text-[12px] font-semibold">
                  {formatUsd(w.amountUsd, { compact: true })}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1.5 text-[10px] text-[color:var(--color-text-tertiary)]">
                  <span><TimeAgo iso={w.at} /></span>
                  <ExternalLink size={9} />
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
