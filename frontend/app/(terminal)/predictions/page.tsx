import { GenerateSignalButton } from "@/components/generate-signal-button";
import { PredictionHistory } from "@/components/prediction-history";

export default function PredictionsPage() {
  return (
    <main className="flex-1 bg-[color:var(--color-bg)] p-3 sm:p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-[18px] font-semibold tracking-tight sm:text-[20px]">
            Prediction Ledger
          </h1>
          <p className="mt-1 max-w-2xl text-[12px] text-[color:var(--color-text-secondary)]">
            Every AI prediction is committed to{" "}
            <span className="mono text-[color:var(--color-primary)]">PredictionStore.sol</span> on
            Mantle Sepolia before publishing. Outcomes are derived on-chain from realized price
            moves. No off-chain trust required.
          </p>
        </div>
        <GenerateSignalButton />
      </div>
      <PredictionHistory />
    </main>
  );
}
