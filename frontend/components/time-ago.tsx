"use client";

// Client-only relative-time renderer. SSR outputs an empty string so the server
// markup doesn't disagree with client-side time math. Re-renders every 30s.

import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/utils";

export function TimeAgo({ iso }: { iso: string }) {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    const tick = () => setLabel(relativeTime(iso));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [iso]);

  return <span suppressHydrationWarning>{label}</span>;
}
