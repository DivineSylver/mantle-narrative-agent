import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Eye,
  Link2,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Sigil } from "@/components/sigil";

function GithubMark({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.16-.02-2.1-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.92 10.92 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

const CONTRACT = "0xfA6a1B789Ea499eBCCefb08aacB8637a0CB3a677";
const EXPLORER = `https://sepolia.mantlescan.xyz/address/${CONTRACT}`;
const REPO = "https://github.com/DivineSylver/mantle-narrative-agent";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Narrative engine",
    body: "GPT-4o compresses 24-hour on-chain flows into structured signals: title, category, impact, and confidence. Every bullet maps to a real on-chain event, not a tweet.",
    tag: "AI · LIVE",
  },
  {
    icon: Wallet,
    title: "Smart-money tracking",
    body: "Wallets scored by FIFO realized PnL, hold time, and consistency. Elite tier surfaces who's actually winning so users can shadow real capital, not narratives.",
    tag: "FIFO · COMPOSITE",
  },
  {
    icon: Link2,
    title: "On-chain prediction ledger",
    body: "Every AI signal is committed to PredictionStore.sol on Mantle before publishing. Outcomes resolve on-chain. The track record is a fact, not a marketing line.",
    tag: "MANTLE SEPOLIA",
  },
];

const PILLARS = [
  { value: "5", label: "Tracked assets", sub: "MNT · mETH · fBTC · USDY · USDC" },
  { value: "7+", label: "Mantle protocols", sub: "Merchant Moe · Agni · INIT · …" },
  { value: "≥ $250k", label: "Whale flow floor", sub: "Per move, real-time" },
  { value: "0%", label: "Off-chain trust", sub: "Predictions verifiable on Mantlescan" },
];

export default function Landing() {
  return (
    <main className="flex flex-1 flex-col bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center bg-[color:var(--color-primary)] text-[#03111a]">
            <Sigil size={16} />
          </div>
          <div className="leading-tight">
            <div className="font-mono text-[13px] font-semibold tracking-tight">
              MANTLE<span className="text-[color:var(--color-primary)]">.</span>NARRATIVE
            </div>
            <div className="label-meta hidden sm:block">On-chain intelligence terminal</div>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost hidden sm:inline-flex"
          >
            <GithubMark size={12} />
            GITHUB
          </a>
          <Link href="/app" className="btn-primary">
            <span className="hidden sm:inline">Launch terminal</span>
            <span className="sm:hidden">Terminal</span>
            <ArrowRight size={11} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[color:var(--color-border)]">
        {/* decorative grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-text-tertiary) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-tertiary) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[680px] -translate-x-1/2 rounded-full opacity-[0.18] blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(0,212,170,0.6) 0%, rgba(0,212,170,0) 70%)",
          }}
        />

        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
          <div className="flex items-center gap-2">
            <span className="pulse-dot" />
            <span className="label-meta">Live on Mantle Sepolia</span>
            <span className="label-meta">·</span>
            <a
              href={EXPLORER}
              target="_blank"
              rel="noopener noreferrer"
              className="mono text-[10px] text-[color:var(--color-primary)] hover:underline"
            >
              {CONTRACT.slice(0, 6)}…{CONTRACT.slice(-4)}
            </a>
          </div>

          <h1 className="max-w-4xl font-mono text-[34px] font-semibold leading-[1.05] tracking-tight sm:text-[52px] lg:text-[64px]">
            On-chain intelligence
            <br />
            for Mantle.{" "}
            <span className="text-[color:var(--color-primary)]">Audited by</span>
            <br className="hidden sm:block" />
            <span className="text-[color:var(--color-primary)]"> the blockchain itself.</span>
          </h1>

          <p className="max-w-2xl text-[15px] leading-relaxed text-[color:var(--color-text-secondary)] sm:text-[16px]">
            Bloomberg Terminal-class narratives, smart-money tracking, and AI-predicted alpha
            for the Mantle ecosystem. Every prediction written on-chain so the track record
            can&apos;t be edited, deleted, or marketed.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/app" className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-[12px]">
              Launch terminal
              <ArrowRight size={13} />
            </Link>
            <a
              href={EXPLORER}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost inline-flex items-center gap-2 px-5 py-3 text-[12px]"
            >
              <Eye size={13} />
              View contract on Mantlescan
            </a>
          </div>

          {/* Pillar strip */}
          <div className="mt-10 grid w-full grid-cols-2 gap-px border border-[color:var(--color-border)] bg-[color:var(--color-border)] sm:grid-cols-4">
            {PILLARS.map((p) => (
              <div
                key={p.label}
                className="flex flex-col gap-1 bg-[color:var(--color-surface)] px-4 py-4"
              >
                <div className="font-mono text-[22px] font-semibold leading-none text-[color:var(--color-primary)] sm:text-[26px]">
                  {p.value}
                </div>
                <div className="label-meta">{p.label}</div>
                <div className="mono truncate text-[10px] text-[color:var(--color-text-tertiary)]">
                  {p.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-[color:var(--color-border)] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-3">
            <div className="label-meta flex items-center gap-2">
              <span className="inline-block h-1 w-6 bg-[color:var(--color-primary)]" />
              How it works
            </div>
            <h2 className="max-w-3xl font-mono text-[24px] font-semibold leading-tight sm:text-[32px]">
              Three layers, one verifiable signal.
            </h2>
            <p className="max-w-2xl text-[14px] leading-relaxed text-[color:var(--color-text-secondary)]">
              The agent watches the chain, scores the wallets that move it, and commits its own
              predictions to a contract anyone can read. No off-chain trust.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px bg-[color:var(--color-border)] md:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <article
                  key={f.title}
                  className="group flex flex-col gap-4 bg-[color:var(--color-surface)] p-6 transition-colors hover:bg-[color:var(--color-surface-hover)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="grid h-9 w-9 place-items-center border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-primary)] transition-colors group-hover:border-[color:var(--color-primary)]">
                      <Icon size={16} />
                    </div>
                    <span className="label-meta">
                      <span className="mono">0{i + 1}</span>
                    </span>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-mono text-[15px] font-semibold tracking-tight">
                        {f.title}
                      </h3>
                    </div>
                    <p className="text-[13px] leading-relaxed text-[color:var(--color-text-secondary)]">
                      {f.body}
                    </p>
                  </div>
                  <span className="badge badge-info mt-auto self-start">{f.tag}</span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Proof / on-chain section */}
      <section className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="label-meta flex items-center gap-2">
              <span className="inline-block h-1 w-6 bg-[color:var(--color-primary)]" />
              Why on-chain
            </div>
            <h2 className="font-mono text-[24px] font-semibold leading-tight sm:text-[32px]">
              The prediction ledger lives on Mantle.{" "}
              <span className="text-[color:var(--color-primary)]">Nobody can rewrite it.</span>
            </h2>
            <p className="text-[14px] leading-relaxed text-[color:var(--color-text-secondary)]">
              When the agent generates a signal, it signs and submits{" "}
              <code className="mono text-[color:var(--color-primary)]">recordPrediction()</code>{" "}
              to{" "}
              <a
                href={EXPLORER}
                target="_blank"
                rel="noopener noreferrer"
                className="mono text-[color:var(--color-primary)] hover:underline"
              >
                PredictionStore.sol
              </a>
              . When the horizon ends, the resolver pulls realized price moves and writes the
              outcome to the same contract. Win-rate is a derived on-chain value, not a number
              we report.
            </p>
            <ul className="mt-2 space-y-2 text-[13px] text-[color:var(--color-text-secondary)]">
              {[
                "Append-only: predictions can be voided, never edited",
                "Recorder + resolver roles separated from the owner",
                "Status (Won / Lost) derived from the sign of realized vs predicted",
                "Source verified on Mantlescan, exact bytecode match via Sourcify",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <CheckCircle2
                    size={14}
                    className="mt-0.5 shrink-0 text-[color:var(--color-primary)]"
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2">
              <a
                href={EXPLORER}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost inline-flex items-center gap-2"
              >
                Inspect on Mantlescan
                <ArrowRight size={11} />
              </a>
            </div>
          </div>

          {/* Mocked contract card */}
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-4 -z-10 rounded-2xl opacity-[0.15] blur-3xl"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(0,212,170,0.7) 0%, rgba(0,212,170,0) 60%)",
              }}
            />
            <div className="border border-[color:var(--color-border)] bg-[color:var(--color-bg)]">
              <div className="flex items-center justify-between gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Brain size={13} className="text-[color:var(--color-primary)]" />
                  <span className="label-meta">Latest AI prediction</span>
                </div>
                <span className="badge badge-gain">CONFIRMED</span>
              </div>
              <div className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="badge badge-info">YIELD</span>
                  <span className="label-meta">NR-184 · 18m ago</span>
                </div>
                <h4 className="font-mono text-[18px] font-semibold leading-tight">
                  Institutional Yield Rotation → <span className="text-[color:var(--color-primary)]">mETH bullish</span>
                </h4>
                <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--color-text-secondary)]">
                  Stablecoin reserves rotating into yield-bearing Mantle assets. Three Elite
                  Smart Money wallets accumulated mETH while liquidity migrated out of volatile
                  pairs.
                </p>

                <div className="mt-5 grid grid-cols-3 gap-px bg-[color:var(--color-border)]">
                  <div className="bg-[color:var(--color-surface)] px-3 py-2">
                    <div className="label-meta">Asset</div>
                    <div className="mono mt-0.5 text-[13px] font-semibold">mETH</div>
                  </div>
                  <div className="bg-[color:var(--color-surface)] px-3 py-2">
                    <div className="label-meta">Horizon</div>
                    <div className="mono mt-0.5 text-[13px] font-semibold">7 days</div>
                  </div>
                  <div className="bg-[color:var(--color-surface)] px-3 py-2">
                    <div className="label-meta">Confidence</div>
                    <div className="mono mt-0.5 text-[13px] font-semibold text-[color:var(--color-primary)]">
                      82%
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[color:var(--color-border)] pt-3">
                  <div className="flex items-center gap-2">
                    <Link2 size={11} className="text-[color:var(--color-text-tertiary)]" />
                    <span className="label-meta">Tx</span>
                    <span className="mono text-[11px]">0x26bf…7df0</span>
                  </div>
                  <a
                    href="https://sepolia.mantlescan.xyz/tx/0x26bf606d21aea19574fc40073a525a5308a850872a8b37fa99c4842aaeff7df0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[color:var(--color-primary)] hover:underline"
                  >
                    View →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-[color:var(--color-border)] px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div className="flex flex-col gap-2">
            <div className="label-meta flex items-center gap-2">
              <span className="pulse-dot" />
              Backend live · contract verified · ready to demo
            </div>
            <h2 className="font-mono text-[24px] font-semibold leading-tight sm:text-[32px]">
              Open the terminal.
            </h2>
            <p className="max-w-xl text-[13px] text-[color:var(--color-text-secondary)]">
              Tap Generate AI Signal on the Predictions tab. In ~15 seconds the agent commits a
              new prediction to Mantle and hands you the Mantlescan link.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/app" className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-[12px]">
              Launch terminal
              <ArrowRight size={13} />
            </Link>
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost inline-flex items-center gap-2 px-5 py-3 text-[12px]"
            >
              <GithubMark size={13} />
              Source
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[color:var(--color-surface)] px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-[10px] uppercase tracking-wider text-[color:var(--color-text-tertiary)]">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              MANTLE NARRATIVE AGENT{" "}
              <span className="text-[color:var(--color-primary)]">v0.1</span>
            </span>
            <span>·</span>
            <span>Mantle Sepolia · chain 5003</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[color:var(--color-text-secondary)]"
            >
              GitHub
            </a>
            <span>·</span>
            <a
              href={EXPLORER}
              target="_blank"
              rel="noopener noreferrer"
              className="mono text-[color:var(--color-primary)] hover:underline"
            >
              0xfA6a…a677
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
