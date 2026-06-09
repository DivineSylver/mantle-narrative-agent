import { SmartMoneyFeed } from "@/components/smart-money-feed";
import { WhaleTracker } from "@/components/whale-tracker";

export default function WalletsPage() {
  return (
    <main className="flex-1 bg-[color:var(--color-bg)] p-3 sm:p-4">
      <div className="mb-4">
        <h1 className="font-mono text-[18px] font-semibold tracking-tight sm:text-[20px]">
          Wallet Intelligence
        </h1>
        <p className="mt-1 text-[12px] text-[color:var(--color-text-secondary)]">
          Smart-money classification (Elite / Pro / Active) plus a live tape of whale flows ≥ $250k
          across MNT, mETH, fBTC, USDY, USDC. Tap any row to view on Mantlescan.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-px bg-[color:var(--color-border)] lg:grid-cols-12">
        <div className="bg-[color:var(--color-bg)] lg:col-span-5">
          <SmartMoneyFeed />
        </div>
        <div className="bg-[color:var(--color-bg)] lg:col-span-7">
          <WhaleTracker />
        </div>
      </div>
    </main>
  );
}
