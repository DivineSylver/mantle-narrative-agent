import { Header } from "@/components/header";
import { KpiStrip } from "@/components/kpi-strip";
import { TickerBar } from "@/components/ticker-bar";

export default function TerminalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <TickerBar />
      <KpiStrip />
      {children}
      <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-[color:var(--color-text-tertiary)]">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              MANTLE NARRATIVE AGENT{" "}
              <span className="text-[color:var(--color-primary)]">v0.1</span>
            </span>
            <span>·</span>
            <span>Data: Mantle RPC · DeFiLlama · CoinGecko</span>
            <span>·</span>
            <span>AI: GPT-4o</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Contract:{" "}
              <a
                href="https://sepolia.mantlescan.xyz/address/0xfA6a1B789Ea499eBCCefb08aacB8637a0CB3a677"
                target="_blank"
                rel="noreferrer"
                className="mono text-[color:var(--color-primary)] hover:underline"
              >
                0xfA6a…a677
              </a>
            </span>
            <span>·</span>
            <span>Network: Mantle Sepolia</span>
          </div>
        </div>
      </footer>
    </>
  );
}
