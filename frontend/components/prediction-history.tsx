"use client";

import { useOnChainPredictions } from "@/lib/onchain";
import { CheckCircle2, Circle, ExternalLink, Link2, Loader2, XCircle } from "lucide-react";
import { Panel } from "./panel";
import { TimeAgo } from "./time-ago";

const EXPLORER = "https://sepolia.mantlescan.xyz";
const CONTRACT_ADDR = "0xfA6a1B789Ea499eBCCefb08aacB8637a0CB3a677";

const STATUS_META: Record<string, { Icon: typeof Circle; color: string; label: string }> = {
  Open: { Icon: Circle, color: "text-[color:var(--color-info)]", label: "Open" },
  Won: { Icon: CheckCircle2, color: "text-[color:var(--color-gain)]", label: "Won" },
  Lost: { Icon: XCircle, color: "text-[color:var(--color-loss)]", label: "Lost" },
  Voided: { Icon: XCircle, color: "text-[color:var(--color-text-tertiary)]", label: "Voided" },
};

export function PredictionHistory() {
  const { predictions, total, isLoading } = useOnChainPredictions(50);

  const open = predictions.filter((p) => p.status === "Open").length;
  const won = predictions.filter((p) => p.status === "Won").length;
  const lost = predictions.filter((p) => p.status === "Lost").length;
  const settled = won + lost;
  const winRatePct = settled > 0 ? (won / settled) * 100 : 0;
  const realizedValues = predictions
    .filter((p) => p.realizedPct !== null)
    .map((p) => p.realizedPct as number);
  const avgRealizedPct =
    realizedValues.length > 0
      ? realizedValues.reduce((s, v) => s + v, 0) / realizedValues.length
      : 0;
  const lifetimeRoi = realizedValues.reduce((s, v) => s + v, 0);

  return (
    <Panel
      title="Prediction Ledger"
      meta={
        <span className="label-meta">
          <Link2 size={9} className="mr-1 inline text-[color:var(--color-primary)]" />
          on-chain · Mantle Sepolia · verifiable
        </span>
      }
      action={
        <a
          href={`${EXPLORER}/address/${CONTRACT_ADDR}`}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost"
        >
          CONTRACT
          <ExternalLink size={10} />
        </a>
      }
      noPadding
    >
      <div className="grid grid-cols-4 gap-px border-b border-[color:var(--color-border)] bg-[color:var(--color-border)]">
        <Stat label="Total on-chain" value={total.toString()} />
        <Stat
          label="Win rate"
          value={settled > 0 ? `${winRatePct.toFixed(1)}%` : "-"}
          accent={settled > 0 ? "text-[color:var(--color-gain)]" : ""}
        />
        <Stat
          label="Avg realized"
          value={realizedValues.length > 0 ? formatPct(avgRealizedPct) : "-"}
          accent={
            realizedValues.length > 0 && avgRealizedPct >= 0
              ? "text-[color:var(--color-gain)]"
              : "text-[color:var(--color-loss)]"
          }
        />
        <Stat
          label="Open positions"
          value={open.toString()}
          accent="text-[color:var(--color-primary)]"
        />
      </div>

      {predictions.length === 0 ? (
        <EmptyState isLoading={isLoading} />
      ) : (
        <>
          <div className="grid grid-cols-12 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-[10px] uppercase tracking-wider text-[color:var(--color-text-tertiary)]">
            <div className="col-span-1">ID</div>
            <div className="col-span-2">Asset</div>
            <div className="col-span-2">Direction</div>
            <div className="col-span-2 text-right">Confidence</div>
            <div className="col-span-1 text-right">Horizon</div>
            <div className="col-span-2 text-right">Result</div>
            <div className="col-span-2 text-right">On-chain</div>
          </div>
          <ul className="divide-y divide-[color:var(--color-border)]">
            {predictions.map((p) => {
              const s = STATUS_META[p.status];
              const Icon = s.Icon;
              return (
                <li
                  key={p.id}
                  className="row-hover grid grid-cols-12 items-center gap-2 px-4 py-2.5"
                >
                  <div className="col-span-1 mono text-[11px] text-[color:var(--color-text-tertiary)]">
                    #{p.id}
                  </div>
                  <div className="col-span-2 mono text-[12px] font-semibold">{p.asset}</div>
                  <div className="col-span-2">
                    <span
                      className={`badge ${
                        p.direction === "Bullish"
                          ? "badge-gain"
                          : p.direction === "Bearish"
                            ? "badge-loss"
                            : "badge"
                      }`}
                    >
                      {p.direction}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <ConfidenceBar value={p.confidence} />
                    <span className="mono tabular text-[11px] w-8 text-right">{p.confidence}</span>
                  </div>
                  <div className="col-span-1 mono tabular text-right text-[11px]">
                    {p.horizonDays}d
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    <Icon size={12} className={s.color} />
                    <span className={`mono text-[11px] ${s.color}`}>
                      {p.status === "Open" ? (
                        <TimeAgo iso={p.createdAtIso} />
                      ) : p.realizedPct !== null ? (
                        formatPct(p.realizedPct)
                      ) : (
                        s.label
                      )}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    <a
                      href={`${EXPLORER}/address/${CONTRACT_ADDR}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mono text-[10px] text-[color:var(--color-primary)] hover:underline"
                    >
                      view #{p.id}
                    </a>
                    <ExternalLink size={9} className="text-[color:var(--color-text-tertiary)]" />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Panel>
  );
}

function EmptyState({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {isLoading ? (
        <Loader2 size={24} className="animate-spin text-[color:var(--color-primary)]" />
      ) : (
        <Circle size={24} className="text-[color:var(--color-text-tertiary)]" />
      )}
      <div className="font-mono text-[14px] font-semibold">
        {isLoading ? "Reading from Mantle Sepolia…" : "No predictions on-chain yet"}
      </div>
      <p className="max-w-md text-[12px] leading-relaxed text-[color:var(--color-text-secondary)]">
        The AI agent commits each prediction to{" "}
        <span className="mono text-[color:var(--color-primary)]">PredictionStore.sol</span> before
        publishing. Predictions will appear here once the agent has generated any.
      </p>
      <a
        href={`${EXPLORER}/address/${CONTRACT_ADDR}`}
        target="_blank"
        rel="noreferrer"
        className="btn-ghost mt-2"
      >
        View contract on Mantlescan
        <ExternalLink size={10} />
      </a>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-[color:var(--color-surface)] px-4 py-3">
      <div className="label-meta">{label}</div>
      <div className={`mono mt-1 text-[20px] font-semibold ${accent ?? ""}`}>{value}</div>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-20 overflow-hidden bg-[color:var(--color-border)]">
      <div
        className="h-full bg-[color:var(--color-primary)]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function formatPct(v: number): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}
