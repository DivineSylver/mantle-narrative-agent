"use client";

import { useEcosystemKpi } from "@/lib/hooks";
import { Sparkline } from "./sparkline";

export function KpiStrip() {
  const { data: kpis } = useEcosystemKpi();
  return (
    <div className="grid grid-cols-2 border-b border-[color:var(--color-border)] sm:grid-cols-3 lg:grid-cols-6">
      {kpis.map((kpi, i) => {
        const pos = kpi.positive ?? true;
        return (
          <div
            key={kpi.label}
            className={`flex items-center justify-between gap-4 px-4 py-3 ${
              i < kpis.length - 1 ? "border-r border-[color:var(--color-border)]" : ""
            }`}
          >
            <div className="flex flex-col gap-1">
              <div className="label-meta">{kpi.label}</div>
              <div className="stat-value">{kpi.value}</div>
              {kpi.change ? (
                <div
                  className={`mono tabular text-[11px] ${
                    pos ? "text-[color:var(--color-gain)]" : "text-[color:var(--color-loss)]"
                  }`}
                >
                  {pos ? "▲" : "▼"} {kpi.change}
                </div>
              ) : null}
            </div>
            {kpi.trend ? <Sparkline points={kpi.trend} positive={pos} width={72} height={28} /> : null}
          </div>
        );
      })}
    </div>
  );
}
