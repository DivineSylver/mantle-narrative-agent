"use client";

import { useProtocols } from "@/lib/hooks";
import { formatUsd } from "@/lib/utils";
import { Panel } from "./panel";

export function ProtocolLeaderboard() {
  const { data: protos } = useProtocols();
  const sorted = [...protos].sort((a, b) => b.tvlUsd - a.tvlUsd);
  const totalTvl = sorted.reduce((s, p) => s + p.tvlUsd, 0);

  return (
    <Panel
      title="Protocol Leaderboard"
      meta={<span className="label-meta">Mantle ecosystem · sorted by TVL</span>}
      action={<button className="btn-ghost">EXPORT CSV</button>}
      noPadding
    >
      <div className="grid grid-cols-12 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-[10px] uppercase tracking-wider text-[color:var(--color-text-tertiary)]">
        <div className="col-span-1">#</div>
        <div className="col-span-3">Protocol</div>
        <div className="col-span-2">Category</div>
        <div className="col-span-2 text-right">TVL</div>
        <div className="col-span-1 text-right">Δ 24h</div>
        <div className="col-span-2 text-right">Vol 24h</div>
        <div className="col-span-1 text-right">Fees</div>
      </div>
      <ul className="divide-y divide-[color:var(--color-border)]">
        {sorted.map((p, i) => {
          const share = (p.tvlUsd / totalTvl) * 100;
          const pos = p.tvlChange24h >= 0;
          return (
            <li key={p.name} className="row-hover relative px-4 py-2.5">
              <div
                className="absolute inset-y-0 left-0 bg-[color:var(--color-primary)] opacity-[0.04]"
                style={{ width: `${share}%` }}
              />
              <div className="relative grid grid-cols-12 items-center gap-2">
                <div className="col-span-1 mono tabular text-[11px] text-[color:var(--color-text-tertiary)]">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="col-span-3">
                  <div className="mono text-[12px] font-semibold">{p.name}</div>
                  <div className="label-meta mt-0.5">{share.toFixed(1)}% share</div>
                </div>
                <div className="col-span-2">
                  <span className="badge">{p.category}</span>
                </div>
                <div className="col-span-2 mono tabular text-right text-[12px] font-semibold">
                  {formatUsd(p.tvlUsd, { compact: true })}
                </div>
                <div
                  className={`col-span-1 mono tabular text-right text-[11px] ${
                    pos ? "text-[color:var(--color-gain)]" : "text-[color:var(--color-loss)]"
                  }`}
                >
                  {pos ? "+" : ""}
                  {p.tvlChange24h.toFixed(1)}%
                </div>
                <div className="col-span-2 mono tabular text-right text-[12px]">
                  {formatUsd(p.volume24h, { compact: true })}
                </div>
                <div className="col-span-1 mono tabular text-right text-[11px] text-[color:var(--color-text-secondary)]">
                  {formatUsd(p.fees24h, { compact: true })}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
