import { EcosystemHeatmap } from "@/components/ecosystem-heatmap";
import { ProtocolLeaderboard } from "@/components/protocol-leaderboard";

export default function ProtocolsPage() {
  return (
    <main className="flex-1 bg-[color:var(--color-bg)] p-3 sm:p-4">
      <div className="mb-4">
        <h1 className="font-mono text-[18px] font-semibold tracking-tight sm:text-[20px]">
          Mantle Protocol Universe
        </h1>
        <p className="mt-1 text-[12px] text-[color:var(--color-text-secondary)]">
          Live Mantle TVL, 24h deltas, and ecosystem momentum across categories. Data source:
          DeFiLlama.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-px bg-[color:var(--color-border)] lg:grid-cols-12">
        <div className="bg-[color:var(--color-bg)] lg:col-span-7">
          <ProtocolLeaderboard />
        </div>
        <div className="bg-[color:var(--color-bg)] lg:col-span-5">
          <EcosystemHeatmap />
        </div>
      </div>
    </main>
  );
}
