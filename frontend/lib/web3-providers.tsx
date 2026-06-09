"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { WagmiProvider, http } from "wagmi";
import { mantle, mantleSepolia } from "./chains";

const config = getDefaultConfig({
  appName: "Mantle Narrative Agent",
  // Public WalletConnect projectId — works for demo. Swap for your own at https://cloud.walletconnect.com
  projectId: "c4f79cc821944d9680842e34466bfbd9",
  chains: [mantleSepolia, mantle],
  transports: {
    [mantleSepolia.id]: http(),
    [mantle.id]: http(),
  },
  ssr: true,
});

export function Web3Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#00d4aa",
            accentColorForeground: "#03111a",
            borderRadius: "none",
            fontStack: "system",
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
