"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";
import { generatePrediction, type GeneratedPrediction } from "@/lib/api";

export function GenerateSignalButton() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<GeneratedPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const r = await generatePrediction();
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={onClick}
        disabled={pending}
        className="btn-primary disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <Sparkles size={11} />
        )}
        {pending ? "Committing to Mantle…" : "Generate AI Signal"}
      </button>
      {error ? (
        <div className="border border-[color:var(--color-loss)] bg-[color:var(--color-loss)]/10 px-3 py-2 text-[11px] text-[color:var(--color-loss)]">
          {error}
        </div>
      ) : null}
      {result ? (
        <div className="border border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/5 px-3 py-2">
          <div className="label-meta mb-1">Committed on-chain</div>
          <div className="mono text-[12px]">
            #{result.onChainId} {result.asset} ·{" "}
            <span
              className={
                result.direction === "Bullish"
                  ? "text-[color:var(--color-gain)]"
                  : result.direction === "Bearish"
                    ? "text-[color:var(--color-loss)]"
                    : ""
              }
            >
              {result.direction}
            </span>{" "}
            · {result.confidence}% · {result.horizonDays}d
          </div>
          {result.explorerUrl ? (
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-[color:var(--color-primary)] hover:underline"
            >
              View tx on Mantlescan
              <ExternalLink size={9} />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
