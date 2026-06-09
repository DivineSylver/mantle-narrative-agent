"use client";

import { useNarratives } from "@/lib/hooks";
import type { Narrative } from "@/lib/mock-data";
import { ArrowUpRight, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Panel } from "./panel";
import { TimeAgo } from "./time-ago";

const CAT_BADGE: Record<string, string> = {
  Yield: "badge-info",
  BTCFi: "badge-warn",
  RWA: "badge-gain",
  DEX: "badge",
  Stablecoins: "badge",
  "Liquid Staking": "badge-info",
};

export function NarrativeFeed() {
  const { data: narratives } = useNarratives();
  const [selectedId, setSelectedId] = useState<string>("");
  const selected = useMemo(
    () => narratives.find((n) => n.id === selectedId) ?? narratives[0] ?? null,
    [narratives, selectedId],
  );

  useEffect(() => {
    if (narratives.length === 0) return;
    // honor #NR-XXX hash deep-link from search
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (hash && narratives.some((n) => n.id === hash)) {
      setSelectedId(hash);
      return;
    }
    if (!selectedId) setSelectedId(narratives[0].id);
  }, [narratives, selectedId]);

  return (
    <Panel
      title="Narrative Feed"
      meta={
        <span className="label-meta">
          <Sparkles size={9} className="mr-1 inline text-[color:var(--color-primary)]" />
          AI-detected · live
        </span>
      }
      action={
        <>
          <button className="btn-ghost">7D</button>
          <button className="btn-ghost border-[color:var(--color-primary)] text-[color:var(--color-primary)]">
            24H
          </button>
        </>
      }
      noPadding
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Feed list */}
        <ul className="divide-y divide-[color:var(--color-border)] overflow-y-auto">
          {narratives.map((n) => {
            const active = n.id === selectedId;
            const Icon =
              n.impact === "Bullish" ? TrendingUp : n.impact === "Bearish" ? TrendingDown : TrendingUp;
            return (
              <li key={n.id}>
                <button
                  onClick={() => setSelectedId(n.id)}
                  className={`row-hover flex w-full flex-col gap-2 px-4 py-3 text-left ${
                    active ? "bg-[color:var(--color-surface-hover)]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${CAT_BADGE[n.category] ?? "badge"}`}>{n.category}</span>
                      <span className="label-meta">{n.id}</span>
                    </div>
                    <span className="label-meta"><TimeAgo iso={n.detectedAt} /></span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-mono text-[13px] font-semibold leading-tight">{n.title}</div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Icon
                        size={12}
                        className={
                          n.impact === "Bullish"
                            ? "text-[color:var(--color-gain)]"
                            : n.impact === "Bearish"
                              ? "text-[color:var(--color-loss)]"
                              : "text-[color:var(--color-text-secondary)]"
                        }
                      />
                      <span className="mono text-[12px] font-semibold">{n.confidence}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ConfidenceBar value={n.confidence} />
                    <span className="label-meta whitespace-nowrap">CONF</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Detail */}
        <aside className="border-t border-[color:var(--color-border)] lg:border-l lg:border-t-0">
          {selected ? (
            <DetailPane narrative={selected} />
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <span className="label-meta">Select a narrative</span>
            </div>
          )}
        </aside>
      </div>
    </Panel>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="relative h-1 flex-1 overflow-hidden bg-[color:var(--color-border)]">
      <div
        className="absolute inset-y-0 left-0 bg-[color:var(--color-primary)]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function DetailPane({ narrative: n }: { narrative: Narrative }) {
  return (
    <>
      <div className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`badge ${CAT_BADGE[n.category] ?? "badge"}`}>{n.category}</span>
            <span className="label-meta">{n.id}</span>
          </div>
          <span
            className={`badge ${
              n.impact === "Bullish" ? "badge-gain" : n.impact === "Bearish" ? "badge-loss" : "badge"
            }`}
          >
            {n.impact}
          </span>
        </div>
        <h3 className="mt-2 font-mono text-[18px] font-semibold leading-tight">{n.title}</h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--color-text-secondary)]">
          {n.summary}
        </p>
      </div>

      <div className="px-4 py-3">
        <div className="label-meta mb-2">Supporting evidence</div>
        <ul className="space-y-1.5">
          {n.evidence.map((e) => (
            <li key={e} className="flex items-start gap-2 text-[12px] text-[color:var(--color-text-secondary)]">
              <span className="mt-1 inline-block h-1 w-1 shrink-0 bg-[color:var(--color-primary)]" />
              <span className="mono">{e}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-[color:var(--color-border)] bg-[color:var(--color-border)]">
        <div className="bg-[color:var(--color-surface)] px-4 py-3">
          <div className="label-meta">Assets</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {(n.assets ?? []).map((a: string) => (
              <span key={a} className="badge">{a}</span>
            ))}
          </div>
        </div>
        <div className="bg-[color:var(--color-surface)] px-4 py-3">
          <div className="label-meta">Protocols</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {(n.protocols ?? []).map((p: string) => (
              <span key={p} className="badge">{p}</span>
            ))}
          </div>
        </div>
        {n.historicalMatch ? (
          <div className="col-span-2 bg-[color:var(--color-surface)] px-4 py-3">
            <div className="label-meta">Historical match</div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <div className="mono text-[12px]">{n.historicalMatch.label}</div>
              <div className="mono text-[12px] text-[color:var(--color-primary)]">
                {(n.historicalMatch.similarity * 100).toFixed(0)}% similar
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[color:var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="label-meta">Confidence</span>
          <span className="mono text-[14px] font-semibold text-[color:var(--color-primary)]">
            {n.confidence}%
          </span>
        </div>
        <Link href={`/predictions#${n.id}`} className="btn-primary">
          View prediction
          <ArrowUpRight size={11} />
        </Link>
      </div>
    </>
  );
}
