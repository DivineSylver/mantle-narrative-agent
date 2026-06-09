// API client — typed fetch wrappers for the Mantle Narrative Agent backend.
// All endpoints are proxied via Next.js rewrites (see next.config.ts).

import type {
  HeatCell,
  Kpi,
  Narrative,
  Prediction,
  Protocol,
  SmartMoneyWallet,
  TickerItem,
  WhaleMove,
} from "./mock-data";

const BASE = "/api/v1";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`${path}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`${path}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export type GeneratedPrediction = {
  ok: boolean;
  predictionId: number;
  onChainId: number | null;
  txHash: string | null;
  asset: string;
  direction: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  horizonDays: number;
  narrativeId: string | null;
  explorerUrl: string | null;
};

export async function generatePrediction(): Promise<GeneratedPrediction> {
  return post<GeneratedPrediction>("/predictions/generate");
}

// ---- Narratives ----

export async function fetchNarratives(): Promise<Narrative[]> {
  return get<Narrative[]>("/narratives?limit=20");
}

// ---- Smart Money ----

export async function fetchSmartMoney(): Promise<SmartMoneyWallet[]> {
  return get<SmartMoneyWallet[]>("/smart-money?limit=25");
}

// ---- Whales ----

export async function fetchWhales(): Promise<WhaleMove[]> {
  return get<WhaleMove[]>("/whales?limit=50");
}

// ---- Predictions ----

export async function fetchPredictions(): Promise<Prediction[]> {
  return get<Prediction[]>("/predictions?limit=50");
}

export type PredictionStats = {
  total: number;
  open: number;
  won: number;
  lost: number;
  winRatePct: number;
  avgRealizedPct: number;
  lifetimeRoi: number;
};

export async function fetchPredictionStats(): Promise<PredictionStats> {
  return get<PredictionStats>("/predictions/stats");
}

// ---- Protocols ----

export async function fetchProtocols(): Promise<Protocol[]> {
  return get<Protocol[]>("/protocols");
}

// ---- Prices (Ticker) ----

export async function fetchPrices(): Promise<TickerItem[]> {
  return get<TickerItem[]>("/prices");
}

// ---- Ecosystem KPI ----

export async function fetchEcosystemKpi(): Promise<Kpi[]> {
  return get<Kpi[]>("/ecosystem/kpi");
}

// ---- Ecosystem Heatmap ----

export type HeatmapResponse = {
  categories: string[];
  assets: string[];
  cells: HeatCell[];
};

export async function fetchHeatmap(): Promise<HeatmapResponse> {
  return get<HeatmapResponse>("/ecosystem/heatmap");
}
