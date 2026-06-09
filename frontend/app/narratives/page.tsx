import { NarrativeFeed } from "@/components/narrative-feed";

export default function NarrativesPage() {
  return (
    <main className="flex-1 bg-[color:var(--color-bg)] p-4">
      <div className="mb-4">
        <h1 className="font-mono text-[20px] font-semibold tracking-tight">Narrative Engine</h1>
        <p className="mt-1 text-[12px] text-[color:var(--color-text-secondary)]">
          AI-detected narratives on the Mantle ecosystem. Each narrative is derived from on-chain
          flows, smart-money behavior, and protocol metrics — then fed through GPT-4o for synthesis.
        </p>
      </div>
      <NarrativeFeed />
    </main>
  );
}
