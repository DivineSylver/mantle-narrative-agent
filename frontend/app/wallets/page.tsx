import { SmartMoneyFeed } from "@/components/smart-money-feed";
import { WhaleTracker } from "@/components/whale-tracker";

export default function WalletsPage() {
  return (
    <main className="flex-1 bg-[color:var(--color-bg)] p-4">
      <div className="mb-4">
        <h1 className="font-mono text-[20px] font-semibold tracking-tight">Wallet Intelligence</h1>
        <p className="mt-1 text-[12px] text-[color:var(--color-text-secondary)]">
          Smart-money classification (Elite / Pro / Active) plus a live tape of whale flows ≥ $250k
          across MNT, mETH, fBTC, USDY, USDC.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-px bg-[color:var(--color-border)] xl:grid-cols-12">
        <div className="xl:col-span-5 bg-[color:var(--color-bg)]">
          <SmartMoneyFeed />
        </div>
        <div className="xl:col-span-7 bg-[color:var(--color-bg)]">
          <WhaleTracker />
        </div>
      </div>
    </main>
  );
}
