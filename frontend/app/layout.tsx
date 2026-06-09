import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { KpiStrip } from "@/components/kpi-strip";
import { TickerBar } from "@/components/ticker-bar";
import { Web3Providers } from "@/lib/web3-providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Mantle Narrative Agent — On-chain Intelligence Terminal",
  description:
    "Autonomous AI analyst for the Mantle ecosystem. Narrative detection, smart-money tracking, and on-chain verified predictions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
        <Web3Providers>
          <div className="flex min-h-screen flex-col bg-[color:var(--color-bg)]">
            <Header />
            <TickerBar />
            <KpiStrip />
            {children}
            <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-[color:var(--color-text-tertiary)]">
                <div className="flex items-center gap-3">
                  <span>
                    MANTLE NARRATIVE AGENT{" "}
                    <span className="text-[color:var(--color-primary)]">v0.1</span>
                  </span>
                  <span>·</span>
                  <span>Data: Mantle RPC · DeFiLlama · CoinGecko</span>
                  <span>·</span>
                  <span>AI: GPT-4o</span>
                </div>
                <div className="flex items-center gap-3">
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
          </div>
        </Web3Providers>
      </body>
    </html>
  );
}
