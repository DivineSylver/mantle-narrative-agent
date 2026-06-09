"use client";

import { useNarratives, useProtocols, useSmartMoney } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Result = {
  id: string;
  type: "Protocol" | "Narrative" | "Wallet" | "Token";
  label: string;
  sublabel: string;
  href: string;
  external?: boolean;
};

const TOKENS: { symbol: string; name: string }[] = [
  { symbol: "MNT", name: "Mantle (native)" },
  { symbol: "mETH", name: "Mantle Staked Ether" },
  { symbol: "fBTC", name: "Ignition fBTC" },
  { symbol: "USDY", name: "Ondo US Dollar Yield" },
  { symbol: "USDC", name: "USD Coin (bridged)" },
  { symbol: "WETH", name: "Wrapped Ether" },
];

const EXPLORER = "https://sepolia.mantlescan.xyz";

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function SearchBar() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: protocols } = useProtocols();
  const { data: narratives } = useNarratives();
  const { data: wallets } = useSmartMoney();

  // Build a unified search index from live data
  const index = useMemo<Result[]>(() => {
    const results: Result[] = [];

    for (const p of protocols) {
      results.push({
        id: `proto:${p.name}`,
        type: "Protocol",
        label: p.name,
        sublabel: `${p.category} · TVL ${formatCompactUsd(p.tvlUsd)}`,
        href: "/protocols",
      });
    }
    for (const n of narratives) {
      results.push({
        id: `narr:${n.id}`,
        type: "Narrative",
        label: n.title,
        sublabel: `${n.id} · ${n.category} · ${n.impact}`,
        href: `/narratives#${n.id}`,
      });
    }
    for (const w of wallets) {
      results.push({
        id: `wallet:${w.address}`,
        type: "Wallet",
        label: w.label ?? shortAddr(w.address),
        sublabel: `${w.classification} · ${shortAddr(w.address)} · ${w.winRate}% win`,
        href: `${EXPLORER}/address/${w.address}`,
        external: true,
      });
    }
    for (const t of TOKENS) {
      results.push({
        id: `tok:${t.symbol}`,
        type: "Token",
        label: t.symbol,
        sublabel: t.name,
        href: "/protocols",
      });
    }
    return results;
  }, [protocols, narratives, wallets]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];

    // Exact address match → always offer Mantlescan link
    const looksLikeAddr = /^0x[a-fA-F0-9]{4,}/.test(needle);
    const direct: Result[] = looksLikeAddr
      ? [
          {
            id: `direct:${needle}`,
            type: "Wallet",
            label: needle.length >= 42 ? shortAddr(needle) : needle,
            sublabel: "Open on Mantlescan",
            href: `${EXPLORER}/address/${needle}`,
            external: true,
          },
        ]
      : [];

    const scored = index
      .map((r) => {
        const hay = `${r.label} ${r.sublabel} ${r.type}`.toLowerCase();
        const idx = hay.indexOf(needle);
        return { r, score: idx === -1 ? Infinity : idx };
      })
      .filter((x) => x.score !== Infinity)
      .sort((a, b) => a.score - b.score)
      .slice(0, 8)
      .map((x) => x.r);

    return [...direct, ...scored];
  }, [q, index]);

  // Reset cursor whenever results change
  useEffect(() => {
    setCursor(0);
  }, [q]);

  // Global "/" focuses the search; Esc clears focus
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click outside closes
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(r: Result) {
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
    if (r.external) {
      window.open(r.href, "_blank", "noopener");
    } else {
      router.push(r.href);
    }
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(filtered.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = filtered[cursor];
      if (r) go(r);
    }
  }

  const showDropdown = open && q.trim().length > 0;

  return (
    <div ref={containerRef} className="relative">
      <label className="flex items-center gap-2 border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2.5 py-1.5">
        <Search size={12} className="text-[color:var(--color-text-tertiary)]" />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKey}
          placeholder="Search wallet, token, protocol…"
          className="w-64 bg-transparent text-[11px] outline-none placeholder:text-[color:var(--color-text-tertiary)]"
          spellCheck={false}
          autoComplete="off"
        />
        <kbd className="border border-[color:var(--color-border)] px-1 font-mono text-[9px] text-[color:var(--color-text-tertiary)]">
          /
        </kbd>
      </label>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[60vh] overflow-y-auto border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-xl">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-[11px] text-[color:var(--color-text-tertiary)]">
              No matches for{" "}
              <span className="mono text-[color:var(--color-text-secondary)]">{q}</span>
            </div>
          ) : (
            <ul>
              {filtered.map((r, i) => {
                const active = i === cursor;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => go(r)}
                      onMouseEnter={() => setCursor(i)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                        active
                          ? "bg-[color:var(--color-surface-hover)]"
                          : ""
                      }`}
                    >
                      <span
                        className={`badge w-[78px] justify-center ${typeBadge(r.type)}`}
                      >
                        {r.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mono truncate text-[12px] font-semibold">
                          {r.label}
                        </div>
                        <div className="truncate text-[10px] text-[color:var(--color-text-tertiary)]">
                          {r.sublabel}
                        </div>
                      </div>
                      {r.external ? (
                        <span className="label-meta shrink-0">↗</span>
                      ) : (
                        <span className="label-meta shrink-0">↵</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function typeBadge(t: Result["type"]): string {
  switch (t) {
    case "Protocol":
      return "badge-info";
    case "Narrative":
      return "badge-gain";
    case "Wallet":
      return "badge-warn";
    case "Token":
      return "badge";
  }
}

function formatCompactUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(n);
}
