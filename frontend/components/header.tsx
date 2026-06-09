"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Activity, Menu, Terminal, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchBar } from "./search-bar";

const NAV = [
  { label: "DASHBOARD", href: "/" },
  { label: "NARRATIVES", href: "/narratives" },
  { label: "WALLETS", href: "/wallets" },
  { label: "PREDICTIONS", href: "/predictions" },
  { label: "PROTOCOLS", href: "/protocols" },
];

export function Header() {
  const pathname = usePathname();
  const [now, setNow] = useState<string>("");
  const [block, setBlock] = useState<number>(74_812_419);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-US", { hour12: false, timeZone: "UTC" }) + " UTC";
    setNow(fmt());
    const i = setInterval(() => {
      setNow(fmt());
      setBlock((b) => b + 1);
    }, 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
        {/* Left: logo + desktop nav */}
        <div className="flex min-w-0 items-center gap-3 lg:gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="grid h-7 w-7 place-items-center bg-[color:var(--color-primary)] text-[#03111a]">
              <Terminal size={14} strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-mono text-[13px] font-semibold tracking-tight">
                MANTLE<span className="text-[color:var(--color-primary)]">.</span>NARRATIVE
              </div>
              <div className="label-meta hidden sm:block">On-chain intelligence terminal</div>
            </div>
          </Link>
          <div className="divider-v hidden h-8 lg:block" />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider ${
                    active
                      ? "border-b-2 border-[color:var(--color-primary)] text-[color:var(--color-text)]"
                      : "border-b-2 border-transparent text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: wallet + collapsibles */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden xl:block">
            <SearchBar />
          </div>
          <ConnectButton
            accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
            chainStatus={{ smallScreen: "icon", largeScreen: "icon" }}
            showBalance={false}
          />
          <div className="hidden items-center gap-2 border-l border-[color:var(--color-border)] pl-3 2xl:flex">
            <span className="pulse-dot" />
            <div className="leading-tight">
              <div className="font-mono text-[11px]">MANTLE · {block.toLocaleString()}</div>
              <div className="label-meta">
                <Activity size={9} className="mr-1 inline" />
                {now}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="grid h-8 w-8 shrink-0 place-items-center border border-[color:var(--color-border)] text-[color:var(--color-text-secondary)] xl:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-3 xl:hidden">
          <div className="mb-3">
            <SearchBar />
          </div>
          <nav className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:hidden">
            {NAV.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`border px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider ${
                    active
                      ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]"
                      : "border-[color:var(--color-border)] text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[color:var(--color-border)] pt-3 text-[10px] uppercase tracking-wider text-[color:var(--color-text-tertiary)]">
            <span className="flex items-center gap-2">
              <span className="pulse-dot" />
              MANTLE · {block.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Activity size={9} />
              {now}
            </span>
          </div>
        </div>
      ) : null}
    </header>
  );
}
