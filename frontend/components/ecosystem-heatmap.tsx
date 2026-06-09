"use client";

import { useHeatmap } from "@/lib/hooks";
import { Panel } from "./panel";

function colorFor(v: number) {
  const a = Math.min(1, Math.abs(v));
  if (v === 0) return "transparent";
  if (v > 0) return `rgba(0, 212, 170, ${0.1 + a * 0.55})`;
  return `rgba(255, 71, 87, ${0.1 + a * 0.55})`;
}

export function EcosystemHeatmap() {
  const { data: hm } = useHeatmap();
  const categories = hm.categories;
  const assets = hm.assets;
  const lookup = new Map<string, number>();
  hm.cells.forEach((c) => lookup.set(`${c.category}|${c.asset}`, c.value));

  return (
    <Panel
      title="Ecosystem Heat Map"
      meta={<span className="label-meta">Momentum score · 24h flow + price + volume</span>}
      action={
        <div className="flex items-center gap-2">
          <span className="label-meta">SCALE</span>
          <div className="flex h-2 w-24 overflow-hidden">
            <div className="flex-1 bg-[color:var(--color-loss)]" />
            <div className="flex-1 bg-[color:var(--color-border)]" />
            <div className="flex-1 bg-[color:var(--color-gain)]" />
          </div>
        </div>
      }
      noPadding
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[color:var(--color-text-tertiary)]" />
              {assets.map((a) => (
                <th
                  key={a}
                  className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-secondary)]"
                >
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat}>
                <td className="border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text-secondary)] whitespace-nowrap">
                  {cat}
                </td>
                {assets.map((a) => {
                  const v = lookup.get(`${cat}|${a}`) ?? 0;
                  return (
                    <td
                      key={a}
                      className="heat-cell p-0 text-center"
                      style={{ background: colorFor(v) }}
                      title={`${cat} × ${a}: ${(v * 100).toFixed(0)}`}
                    >
                      <div className="mono tabular px-2 py-2.5 text-[11px] font-semibold">
                        {v === 0 ? (
                          <span className="text-[color:var(--color-text-tertiary)]">·</span>
                        ) : v > 0 ? (
                          <span className="text-[color:var(--color-gain)]">+{(v * 100).toFixed(0)}</span>
                        ) : (
                          <span className="text-[color:var(--color-loss)]">{(v * 100).toFixed(0)}</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
