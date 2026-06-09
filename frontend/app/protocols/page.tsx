import { EcosystemHeatmap } from "@/components/ecosystem-heatmap";
import { ProtocolLeaderboard } from "@/components/protocol-leaderboard";

export default function ProtocolsPage() {
  return (
    <main className="flex-1 bg-[color:var(--color-bg)] p-4">
      <div className="mb-4">
        <h1 className="font-mono text-[20px] font-semibold tracking-tight">
          Mantle Protocol Universe
        </h1>
        <p className="mt-1 text-[12px] text-[color:var(--color-text-secondary)]">
          Live Mantle TVL, 24h deltas, and ecosystem momentum across categories. Data source:
          DeFiLlama.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-px bg-[color:var(--color-border)] xl:grid-cols-12">
        <div className="xl:col-span-7 bg-[color:var(--color-bg)]">
          <ProtocolLeaderboard />
        </div>
        <div className="xl:col-span-5 bg-[color:var(--color-bg)]">
          <EcosystemHeatmap />
        </div>
      </div>
    </main>
  );
}
