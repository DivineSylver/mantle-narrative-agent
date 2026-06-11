// Mock dataset for the Mantle ecosystem. Wired to be swapped for live RPC/indexer data later.

export type TickerItem = {
  symbol: string;
  price: number;
  change24h: number; // percent
};

export const TICKER: TickerItem[] = [
  { symbol: "MNT", price: 0.6842, change24h: 4.21 },
  { symbol: "mETH", price: 3672.41, change24h: 2.86 },
  { symbol: "fBTC", price: 71248.9, change24h: -1.04 },
  { symbol: "USDY", price: 1.0832, change24h: 0.18 },
  { symbol: "USDC", price: 1.0001, change24h: 0.0 },
  { symbol: "WETH", price: 3669.12, change24h: 2.79 },
  { symbol: "JOE", price: 0.3911, change24h: 6.14 },
  { symbol: "AGNI", price: 0.0421, change24h: -3.55 },
  { symbol: "FLX", price: 1.214, change24h: 8.92 },
  { symbol: "ETH/MNT", price: 5366.4, change24h: -1.31 },
];

export type Kpi = {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  trend?: number[];
};

export const KPIS: Kpi[] = [
  {
    label: "Mantle TVL",
    value: "$1.42B",
    change: "+3.18%",
    positive: true,
    trend: [1.32, 1.34, 1.31, 1.36, 1.38, 1.37, 1.4, 1.39, 1.41, 1.42],
  },
  {
    label: "24h DEX Volume",
    value: "$214.6M",
    change: "+11.4%",
    positive: true,
    trend: [180, 165, 172, 188, 195, 205, 198, 207, 212, 214.6],
  },
  {
    label: "Active Wallets (24h)",
    value: "48,219",
    change: "+5.7%",
    positive: true,
    trend: [42, 41, 44, 43, 45, 44, 46, 47, 46, 48.2],
  },
  {
    label: "Bridge Net Inflow (24h)",
    value: "$8.4M",
    change: "+62%",
    positive: true,
    trend: [-2, 1, 2.5, 3.1, 4.0, 5.2, 5.8, 6.4, 7.6, 8.4],
  },
  {
    label: "mETH Staked",
    value: "412,840",
    change: "+1.9%",
    positive: true,
    trend: [402, 404, 405, 406, 407, 408, 409, 410, 411, 412.84],
  },
  {
    label: "AI Signals (24h)",
    value: "37",
    change: "+9",
    positive: true,
    trend: [25, 28, 22, 30, 32, 28, 35, 31, 34, 37],
  },
];

export type Narrative = {
  id: string;
  title: string;
  category: "RWA" | "BTCFi" | "Yield" | "DEX" | "Stablecoins" | "Liquid Staking";
  confidence: number; // 0-100
  impact: "Bullish" | "Bearish" | "Neutral";
  detectedAt: string; // iso
  summary: string;
  evidence: string[];
  assets: string[];
  protocols: string[];
  historicalMatch?: { label: string; similarity: number };
};

export const NARRATIVES: Narrative[] = [
  {
    id: "NR-184",
    title: "Institutional Yield Rotation",
    category: "Yield",
    confidence: 82,
    impact: "Bullish",
    detectedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    summary:
      "Stablecoin reserves are rotating into yield-bearing Mantle assets. Three Elite Smart Money wallets accumulated mETH while liquidity migrated out of volatile pairs.",
    evidence: [
      "Stablecoin inflows +23.1% (24h)",
      "mETH deposits +17.4%",
      "3 Elite wallets accumulated $4.2M mETH",
      "Liquidity migrated from MNT/USDC into mETH/USDC",
    ],
    assets: ["mETH", "USDY", "USDC"],
    protocols: ["Merchant Moe", "Agni"],
    historicalMatch: { label: "Apr 2025 Yield Rotation", similarity: 0.78 },
  },
  {
    id: "NR-183",
    title: "BTCFi Liquidity Bootstrapping",
    category: "BTCFi",
    confidence: 71,
    impact: "Bullish",
    detectedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    summary:
      "fBTC liquidity depth on Mantle DEXs jumped 31% in 48h. Whale accumulators concentrated in two pools with rising borrow utilization.",
    evidence: [
      "fBTC TVL +31% (48h)",
      "Borrow utilization rose 22% → 47%",
      "2 whales accumulated 38 fBTC",
      "Bridge inflows from Bitcoin L2s spiked",
    ],
    assets: ["fBTC", "WBTC"],
    protocols: ["Agni", "Fluxion"],
    historicalMatch: { label: "Feb 2025 BTCFi Wave", similarity: 0.66 },
  },
  {
    id: "NR-182",
    title: "RWA Adoption Curve Steepening",
    category: "RWA",
    confidence: 64,
    impact: "Bullish",
    detectedAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    summary:
      "USDY supply on Mantle expanded 12% week-over-week. Tokenized treasury demand from on-chain treasuries correlates with falling DeFi yields on majors.",
    evidence: [
      "USDY supply +12% WoW",
      "5 DAOs added USDY to treasury",
      "Avg position size $284k, institutional cohort",
    ],
    assets: ["USDY"],
    protocols: ["Ondo", "Agni"],
  },
  {
    id: "NR-181",
    title: "DEX Liquidity Concentration Risk",
    category: "DEX",
    confidence: 58,
    impact: "Bearish",
    detectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    summary:
      "Top-3 wallets now control 41% of Merchant Moe MNT/USDC liquidity. Withdrawal-side slippage on $250k+ swaps degraded 38 bps overnight.",
    evidence: [
      "LP HHI rose 0.18 → 0.27",
      "Top-3 LP share: 28% → 41%",
      "$250k swap slippage: 0.91% → 1.29%",
    ],
    assets: ["MNT", "USDC"],
    protocols: ["Merchant Moe"],
  },
  {
    id: "NR-180",
    title: "mETH Re-staking Momentum",
    category: "Liquid Staking",
    confidence: 76,
    impact: "Bullish",
    detectedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    summary:
      "mETH supply on Mantle hit ATH. Re-staking deposits onto Fluxion grew 4.1× MoM while validator queue extended.",
    evidence: [
      "mETH supply ATH (412,840)",
      "Re-stake deposits 4.1× MoM",
      "Validator queue: 6.2 days → 9.8 days",
    ],
    assets: ["mETH"],
    protocols: ["Fluxion", "Mantle LSP"],
    historicalMatch: { label: "Jan 2025 LST Surge", similarity: 0.71 },
  },
];

export type SmartMoneyWallet = {
  address: string;
  label?: string;
  classification: "Elite" | "Pro" | "Active";
  winRate: number; // 0-100
  avgRoi: number; // percent
  realizedPnl: number; // usd
  avgHoldDays: number;
  lastAction: { type: "BUY" | "SELL" | "STAKE" | "ADD_LP"; asset: string; amountUsd: number; at: string };
};

export const SMART_MONEY: SmartMoneyWallet[] = [
  {
    address: "0x9a4f3b1c2d8e5a7b6f0c1d3e4f5a6b7c8d9e0a1b",
    label: "Elite #001",
    classification: "Elite",
    winRate: 76,
    avgRoi: 215,
    realizedPnl: 4_120_000,
    avgHoldDays: 38,
    lastAction: { type: "BUY", asset: "mETH", amountUsd: 412_000, at: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
  },
  {
    address: "0x6b2c8d1e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c",
    label: "Whale Alpha",
    classification: "Elite",
    winRate: 71,
    avgRoi: 184,
    realizedPnl: 3_640_000,
    avgHoldDays: 22,
    lastAction: { type: "ADD_LP", asset: "fBTC/USDC", amountUsd: 880_000, at: new Date(Date.now() - 27 * 60 * 1000).toISOString() },
  },
  {
    address: "0x3e5f7a9b1c2d4e6f8a0b2c4d6e8f0a1b3c5d7e9f",
    label: "Yield Hunter",
    classification: "Pro",
    winRate: 68,
    avgRoi: 142,
    realizedPnl: 1_280_000,
    avgHoldDays: 14,
    lastAction: { type: "STAKE", asset: "mETH", amountUsd: 220_000, at: new Date(Date.now() - 51 * 60 * 1000).toISOString() },
  },
  {
    address: "0x1d4f6a8b0c2e4f6a8b0c2e4f6a8b0c2e4f6a8b0c",
    label: "Treasury #07",
    classification: "Pro",
    winRate: 64,
    avgRoi: 118,
    realizedPnl: 942_000,
    avgHoldDays: 67,
    lastAction: { type: "BUY", asset: "USDY", amountUsd: 1_220_000, at: new Date(Date.now() - 82 * 60 * 1000).toISOString() },
  },
  {
    address: "0xa1c3e5f7b9d1c3e5f7b9d1c3e5f7b9d1c3e5f7b9",
    classification: "Active",
    winRate: 59,
    avgRoi: 87,
    realizedPnl: 412_000,
    avgHoldDays: 9,
    lastAction: { type: "SELL", asset: "AGNI", amountUsd: 86_000, at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  },
];

export type WhaleMove = {
  id: string;
  at: string;
  wallet: string;
  walletLabel?: string;
  type: "INFLOW" | "OUTFLOW" | "SWAP" | "BRIDGE_IN" | "BRIDGE_OUT" | "STAKE";
  asset: string;
  amountUsd: number;
  txHash: string;
};

export const WHALES: WhaleMove[] = [
  {
    id: "w1",
    at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    wallet: "0x9a4f3b1c2d8e5a7b6f0c1d3e4f5a6b7c8d9e0a1b",
    walletLabel: "Elite #001",
    type: "INFLOW",
    asset: "mETH",
    amountUsd: 412_000,
    txHash: "0xabc1...92ef",
  },
  {
    id: "w2",
    at: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
    wallet: "0x6b2c8d1e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c",
    walletLabel: "Whale Alpha",
    type: "BRIDGE_IN",
    asset: "USDC",
    amountUsd: 2_400_000,
    txHash: "0x55d2...41a8",
  },
  {
    id: "w3",
    at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    wallet: "0x3e5f7a9b1c2d4e6f8a0b2c4d6e8f0a1b3c5d7e9f",
    walletLabel: "Yield Hunter",
    type: "STAKE",
    asset: "mETH",
    amountUsd: 220_000,
    txHash: "0x77ac...01b3",
  },
  {
    id: "w4",
    at: new Date(Date.now() - 46 * 60 * 1000).toISOString(),
    wallet: "0xf1c8e3a2d4b5c6e7f8a9b0c1d2e3f4a5b6c7d8e9",
    type: "SWAP",
    asset: "MNT → USDC",
    amountUsd: 680_000,
    txHash: "0x91be...c2d4",
  },
  {
    id: "w5",
    at: new Date(Date.now() - 71 * 60 * 1000).toISOString(),
    wallet: "0x1d4f6a8b0c2e4f6a8b0c2e4f6a8b0c2e4f6a8b0c",
    walletLabel: "Treasury #07",
    type: "INFLOW",
    asset: "USDY",
    amountUsd: 1_220_000,
    txHash: "0x42af...77e1",
  },
  {
    id: "w6",
    at: new Date(Date.now() - 102 * 60 * 1000).toISOString(),
    wallet: "0xbb55ee44cc33dd22aa11ff00ee99dd88cc77bb66",
    type: "OUTFLOW",
    asset: "fBTC",
    amountUsd: 540_000,
    txHash: "0x09cd...58b7",
  },
  {
    id: "w7",
    at: new Date(Date.now() - 138 * 60 * 1000).toISOString(),
    wallet: "0x33aa55cc77ee99bb11dd33ff55aa77cc99ee11bb",
    type: "BRIDGE_OUT",
    asset: "WETH",
    amountUsd: 410_000,
    txHash: "0xee14...22ff",
  },
];

export type Prediction = {
  id: number;
  asset: string;
  direction: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  horizonDays: 7 | 30 | 90;
  createdAt: string;
  txHash: string;
  status: "Open" | "Won" | "Lost";
  realizedPct?: number;
  narrativeId?: string;
};

export const PREDICTIONS: Prediction[] = [
  {
    id: 184,
    asset: "mETH",
    direction: "Bullish",
    confidence: 82,
    horizonDays: 7,
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    txHash: "0xabc1...92ef",
    status: "Open",
    narrativeId: "NR-184",
  },
  {
    id: 183,
    asset: "fBTC",
    direction: "Bullish",
    confidence: 71,
    horizonDays: 30,
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    txHash: "0x55d2...41a8",
    status: "Open",
    narrativeId: "NR-183",
  },
  {
    id: 182,
    asset: "USDY",
    direction: "Bullish",
    confidence: 64,
    horizonDays: 90,
    createdAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    txHash: "0x77ac...01b3",
    status: "Open",
    narrativeId: "NR-182",
  },
  {
    id: 181,
    asset: "MNT/USDC LP",
    direction: "Bearish",
    confidence: 58,
    horizonDays: 7,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    txHash: "0x91be...c2d4",
    status: "Open",
    narrativeId: "NR-181",
  },
  {
    id: 180,
    asset: "mETH",
    direction: "Bullish",
    confidence: 76,
    horizonDays: 7,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    txHash: "0x42af...77e1",
    status: "Won",
    realizedPct: 4.8,
    narrativeId: "NR-180",
  },
  {
    id: 179,
    asset: "AGNI",
    direction: "Bullish",
    confidence: 61,
    horizonDays: 7,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    txHash: "0x09cd...58b7",
    status: "Lost",
    realizedPct: -7.1,
  },
  {
    id: 178,
    asset: "fBTC",
    direction: "Bullish",
    confidence: 69,
    horizonDays: 30,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    txHash: "0xee14...22ff",
    status: "Won",
    realizedPct: 11.2,
  },
];

export type Protocol = {
  name: string;
  category: "DEX" | "Lending" | "LST" | "RWA" | "Yield";
  tvlUsd: number;
  tvlChange24h: number; // percent
  volume24h: number;
  users24h: number;
  fees24h: number;
};

export const PROTOCOLS: Protocol[] = [
  { name: "Merchant Moe", category: "DEX", tvlUsd: 318_400_000, tvlChange24h: 3.4, volume24h: 84_200_000, users24h: 12_410, fees24h: 252_000 },
  { name: "Agni Finance", category: "DEX", tvlUsd: 214_800_000, tvlChange24h: 5.1, volume24h: 61_400_000, users24h: 9_120, fees24h: 184_000 },
  { name: "Fluxion", category: "LST", tvlUsd: 188_200_000, tvlChange24h: 7.8, volume24h: 18_400_000, users24h: 4_310, fees24h: 58_000 },
  { name: "Mantle LSP", category: "LST", tvlUsd: 412_900_000, tvlChange24h: 1.9, volume24h: 9_800_000, users24h: 2_810, fees24h: 21_000 },
  { name: "INIT Capital", category: "Lending", tvlUsd: 142_100_000, tvlChange24h: -1.2, volume24h: 4_200_000, users24h: 1_840, fees24h: 36_000 },
  { name: "Ondo USDY", category: "RWA", tvlUsd: 96_300_000, tvlChange24h: 11.4, volume24h: 1_400_000, users24h: 412, fees24h: 8_400 },
  { name: "Pendle Mantle", category: "Yield", tvlUsd: 64_200_000, tvlChange24h: 4.2, volume24h: 3_600_000, users24h: 1_140, fees24h: 12_800 },
];

// Ecosystem heatmap: categories × assets, value = momentum score (-1..1)
export type HeatCell = {
  category: string;
  asset: string;
  value: number; // -1..1
};

export const HEATMAP: HeatCell[] = (() => {
  const cats = ["Liquid Staking", "Stablecoins", "RWA", "BTCFi", "DEX", "Yield"];
  const assets = ["MNT", "mETH", "fBTC", "USDY", "USDC", "JOE", "AGNI", "FLX"];
  const seed = [
    [0.1, 0.78, 0.0, 0.0, 0.0, 0.0, 0.0, 0.62],
    [0.0, 0.0, 0.0, 0.31, 0.04, 0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0, 0.71, 0.0, 0.0, 0.0, 0.0],
    [0.0, 0.0, 0.66, 0.0, 0.0, 0.0, 0.0, 0.41],
    [0.22, 0.18, 0.12, 0.0, 0.08, 0.38, -0.31, 0.42],
    [0.04, 0.51, 0.07, 0.28, 0.0, 0.0, 0.0, 0.39],
  ];
  const out: HeatCell[] = [];
  cats.forEach((c, i) =>
    assets.forEach((a, j) => {
      const v = seed[i][j];
      if (v !== 0) out.push({ category: c, asset: a, value: v });
    }),
  );
  return out;
})();

export const HEATMAP_CATS = ["Liquid Staking", "Stablecoins", "RWA", "BTCFi", "DEX", "Yield"];
export const HEATMAP_ASSETS = ["MNT", "mETH", "fBTC", "USDY", "USDC", "JOE", "AGNI", "FLX"];

// Performance summary (for prediction history header)
export const PREDICTION_STATS = {
  total: 184,
  open: 27,
  won: 112,
  lost: 45,
  winRatePct: 71.3,
  avgRealizedPct: 6.2,
  lifetimeRoi: 38.4,
};
