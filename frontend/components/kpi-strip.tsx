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
            className={`flex items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3 ${
              i < kpis.length - 1 ? "border-r border-[color:var(--color-border)]" : ""
            }`}
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="label-meta truncate">{kpi.label}</div>
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
            {kpi.trend ? (
              <div className="hidden sm:block">
                <Sparkline points={kpi.trend} positive={pos} width={72} height={28} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
