import { EcosystemHeatmap } from "@/components/ecosystem-heatmap";
import { NarrativeFeed } from "@/components/narrative-feed";
import { PredictionHistory } from "@/components/prediction-history";
import { ProtocolLeaderboard } from "@/components/protocol-leaderboard";
import { SmartMoneyFeed } from "@/components/smart-money-feed";
import { WhaleTracker } from "@/components/whale-tracker";

export default function Dashboard() {
  return (
    <main className="grid flex-1 grid-cols-1 gap-px bg-[color:var(--color-border)] lg:grid-cols-12">
      <div className="bg-[color:var(--color-bg)] lg:col-span-7 xl:col-span-8">
        <NarrativeFeed />
      </div>
      <div className="bg-[color:var(--color-bg)] lg:col-span-5 xl:col-span-4">
        <SmartMoneyFeed />
      </div>

      <div className="bg-[color:var(--color-bg)] lg:col-span-7">
        <WhaleTracker />
      </div>
      <div className="bg-[color:var(--color-bg)] lg:col-span-5">
        <EcosystemHeatmap />
      </div>

      <div className="bg-[color:var(--color-bg)] lg:col-span-7">
        <PredictionHistory />
      </div>
      <div className="bg-[color:var(--color-bg)] lg:col-span-5">
        <ProtocolLeaderboard />
      </div>
    </main>
  );
}
