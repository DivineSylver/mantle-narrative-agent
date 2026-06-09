"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Activity, Bell, Terminal } from "lucide-react";
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

  return (
    <header className="flex items-center justify-between gap-4 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2.5">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center bg-[color:var(--color-primary)] text-[#03111a]">
            <Terminal size={14} strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-mono text-[13px] font-semibold tracking-tight">
              MANTLE<span className="text-[color:var(--color-primary)]">.</span>NARRATIVE
            </div>
            <div className="label-meta">On-chain intelligence terminal</div>
          </div>
        </Link>
        <div className="divider-v h-8" />
        <nav className="flex items-center gap-1">
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

      <div className="flex items-center gap-3">
        <SearchBar />
        <button className="btn-ghost">
          <Bell size={12} />
          ALERTS
          <span className="badge badge-gain ml-1">3</span>
        </button>
        <ConnectButton
          accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
          chainStatus={{ smallScreen: "icon", largeScreen: "icon" }}
          showBalance={false}
        />
        <div className="flex items-center gap-2 border-l border-[color:var(--color-border)] pl-3">
          <span className="pulse-dot" />
          <div className="leading-tight">
            <div className="font-mono text-[11px]">MANTLE · {block.toLocaleString()}</div>
            <div className="label-meta">
              <Activity size={9} className="mr-1 inline" />
              {now}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
