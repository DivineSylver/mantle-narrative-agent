// Mantle Sepolia + Mainnet chain configs for wagmi/viem.

import type { Chain } from "viem";

export const mantleSepolia: Chain = {
  id: 5003,
  name: "Mantle Sepolia",
  nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantlescan", url: "https://sepolia.mantlescan.xyz" },
  },
  testnet: true,
};

export const mantle: Chain = {
  id: 5000,
  name: "Mantle",
  nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantlescan", url: "https://mantlescan.xyz" },
  },
};

// Deployed contracts: addresses are populated by `npm run deploy:sepolia`
// (see contracts/deployments/mantleSepolia.json).
export const PREDICTION_STORE_ADDRESS: Record<number, `0x${string}`> = {
  5003: "0xfA6a1B789Ea499eBCCefb08aacB8637a0CB3a677",
};
