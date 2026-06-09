"use client";

import { useWhales } from "@/lib/hooks";
import { formatUsd, shortAddr } from "@/lib/utils";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, ExternalLink, Layers, Waves } from "lucide-react";
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

export function WhaleTracker() {
  const { data: moves } = useWhales();
  return (
    <Panel
      title="Whale Tracker"
      meta={<span className="label-meta">≥ $250k flows · last 4h</span>}
      action={<button className="btn-ghost">FILTER</button>}
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
        {moves.map((w) => {
          const t = TYPE_META[w.type];
          const Icon = t.icon;
          const href = w.txHash ? `${EXPLORER}/tx/${w.txHash}` : `${EXPLORER}/address/${w.wallet}`;
          return (
            <li key={w.id}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="row-hover grid grid-cols-12 items-center gap-2 px-4 py-2.5 cursor-pointer"
                title={w.txHash ? `View tx on Mantlescan` : `View wallet on Mantlescan`}
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
