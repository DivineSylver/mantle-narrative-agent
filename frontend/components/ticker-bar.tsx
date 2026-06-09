"use client";

import { usePrices } from "@/lib/hooks";
import { formatNum } from "@/lib/utils";

export function TickerBar() {
  const { data: ticker } = usePrices();
  const items = [...ticker, ...ticker];
  return (
    <div className="ticker-bar border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] overflow-hidden">
      <div className="ticker-track">
        {items.map((t, i) => {
          const pos = t.change24h >= 0;
          return (
            <div
              key={`${t.symbol}-${i}`}
              className="flex items-center gap-3 border-r border-[color:var(--color-border)] px-4 py-1.5 whitespace-nowrap"
            >
              <span className="font-mono text-[11px] font-semibold tracking-wide">{t.symbol}</span>
              <span className="mono tabular text-[12px]">
                ${formatNum(t.price, { decimals: t.price < 10 ? 4 : 2 })}
              </span>
              <span
                className={`mono tabular text-[11px] ${
                  pos ? "text-[color:var(--color-gain)]" : "text-[color:var(--color-loss)]"
                }`}
              >
                {pos ? "▲" : "▼"} {Math.abs(t.change24h).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
