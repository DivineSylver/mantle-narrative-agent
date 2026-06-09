"use client";

import { useSmartMoney } from "@/lib/hooks";
import { formatUsd, shortAddr } from "@/lib/utils";
import { Crown, ShieldCheck, Zap } from "lucide-react";
import { Panel } from "./panel";
import { TimeAgo } from "./time-ago";

const EXPLORER = "https://sepolia.mantlescan.xyz";

const CLASS_STYLE: Record<string, { badge: string; Icon: typeof Crown }> = {
  Elite: { badge: "badge-gain", Icon: Crown },
  Pro: { badge: "badge-info", Icon: ShieldCheck },
  Active: { badge: "badge", Icon: Zap },
};

export function SmartMoneyFeed() {
  const { data: wallets } = useSmartMoney();
  return (
    <Panel
      title="Smart Money"
      meta={<span className="label-meta">Top performing wallets · 90d</span>}
      action={<button className="btn-ghost">VIEW ALL</button>}
      noPadding
    >
      <div className="grid grid-cols-12 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-[10px] uppercase tracking-wider text-[color:var(--color-text-tertiary)]">
        <div className="col-span-5">Wallet</div>
        <div className="col-span-2 text-right">Win %</div>
        <div className="col-span-2 text-right">Avg ROI</div>
        <div className="col-span-3 text-right">Realized P&L</div>
      </div>
      <ul className="divide-y divide-[color:var(--color-border)]">
        {wallets.map((w) => {
          const cls = CLASS_STYLE[w.classification];
          const Icon = cls.Icon;
          return (
            <li key={w.address}>
              <a
                href={`${EXPLORER}/address/${w.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="row-hover block px-4 py-2.5 cursor-pointer"
                title="View wallet on Mantlescan"
              >
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-5 flex items-center gap-2 min-w-0">
                  <div className="grid h-7 w-7 shrink-0 place-items-center border border-[color:var(--color-border)]">
                    <Icon
                      size={12}
                      className={
                        w.classification === "Elite"
                          ? "text-[color:var(--color-primary)]"
                          : w.classification === "Pro"
                            ? "text-[color:var(--color-info)]"
                            : "text-[color:var(--color-text-secondary)]"
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="mono text-[11px] truncate">{shortAddr(w.address)}</span>
                      <span className={`badge ${cls.badge}`}>{w.classification}</span>
                    </div>
                    <div className="truncate text-[10px] text-[color:var(--color-text-tertiary)]">
                      {w.label ?? "—"}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 mono tabular text-right text-[12px]">{w.winRate}%</div>
                <div className="col-span-2 mono tabular text-right text-[12px] text-[color:var(--color-gain)]">
                  +{w.avgRoi}%
                </div>
                <div className="col-span-3 mono tabular text-right text-[12px]">
                  {formatUsd(w.realizedPnl, { compact: true })}
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2 pl-9 text-[10px] uppercase tracking-wide text-[color:var(--color-text-tertiary)]">
                <span>
                  Last:{" "}
                  <span
                    className={`mono ${
                      w.lastAction.type === "SELL"
                        ? "text-[color:var(--color-loss)]"
                        : "text-[color:var(--color-gain)]"
                    }`}
                  >
                    {w.lastAction.type}
                  </span>{" "}
                  <span className="mono text-[color:var(--color-text)]">{w.lastAction.asset}</span>{" "}
                  <span className="mono">{formatUsd(w.lastAction.amountUsd, { compact: true })}</span>
                </span>
                <span>{w.lastAction ? <TimeAgo iso={w.lastAction.at} /> : "—"}</span>
              </div>
              </a>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
