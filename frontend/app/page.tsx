import { EcosystemHeatmap } from "@/components/ecosystem-heatmap";
import { NarrativeFeed } from "@/components/narrative-feed";
import { PredictionHistory } from "@/components/prediction-history";
import { ProtocolLeaderboard } from "@/components/protocol-leaderboard";
import { SmartMoneyFeed } from "@/components/smart-money-feed";
import { WhaleTracker } from "@/components/whale-tracker";

export default function Dashboard() {
  return (
    <main className="grid flex-1 grid-cols-1 gap-px bg-[color:var(--color-border)] xl:grid-cols-12">
      <div className="xl:col-span-8 bg-[color:var(--color-bg)]">
        <NarrativeFeed />
      </div>
      <div className="xl:col-span-4 bg-[color:var(--color-bg)]">
        <SmartMoneyFeed />
      </div>

      <div className="xl:col-span-7 bg-[color:var(--color-bg)]">
        <WhaleTracker />
      </div>
      <div className="xl:col-span-5 bg-[color:var(--color-bg)]">
        <EcosystemHeatmap />
      </div>

      <div className="xl:col-span-7 bg-[color:var(--color-bg)]">
        <PredictionHistory />
      </div>
      <div className="xl:col-span-5 bg-[color:var(--color-bg)]">
        <ProtocolLeaderboard />
      </div>
    </main>
  );
}
