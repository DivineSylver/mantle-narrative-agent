"use client";

// On-chain hooks: read PredictionStore.sol directly from the connected chain.
// Returns the live ledger, total count, and a per-prediction helper.

import { useReadContract } from "wagmi";
import { PREDICTION_STORE_ADDRESS } from "./chains";
import abi from "./prediction-store-abi.json";

type ContractPrediction = {
  id: bigint;
  asset: string;
  direction: number; // 0=Bearish, 1=Neutral, 2=Bullish
  confidenceBps: number;
  horizonDays: number;
  narrativeId: string;
  recorder: `0x${string}`;
  createdAt: bigint;
  status: number; // 0=Open, 1=Won, 2=Lost, 3=Voided
  realizedBps: number;
  resolvedAt: bigint;
};

export type ChainPrediction = {
  id: number;
  asset: string;
  direction: "Bullish" | "Bearish" | "Neutral";
  confidence: number; // 0..100
  horizonDays: number;
  narrativeId: string;
  recorder: string;
  createdAtIso: string;
  status: "Open" | "Won" | "Lost" | "Voided";
  realizedPct: number | null;
};

const DIR = ["Bearish", "Neutral", "Bullish"] as const;
const STATUS = ["Open", "Won", "Lost", "Voided"] as const;

function decode(p: ContractPrediction): ChainPrediction {
  return {
    id: Number(p.id),
    asset: p.asset,
    direction: DIR[p.direction] ?? "Neutral",
    confidence: Math.round(p.confidenceBps / 100),
    horizonDays: p.horizonDays,
    narrativeId: p.narrativeId,
    recorder: p.recorder,
    createdAtIso: new Date(Number(p.createdAt) * 1000).toISOString(),
    status: STATUS[p.status] ?? "Open",
    realizedPct: p.status === 0 ? null : p.realizedBps / 100,
  };
}

const CHAIN_ID = 5003; // Mantle Sepolia

export function usePredictionCount() {
  const { data, isLoading, error } = useReadContract({
    address: PREDICTION_STORE_ADDRESS[CHAIN_ID],
    abi,
    functionName: "predictionCount",
    chainId: CHAIN_ID,
    query: { refetchInterval: 15_000 },
  });
  return { count: data ? Number(data as bigint) : 0, isLoading, error };
}

export function useOnChainPredictions(limit = 50) {
  const { count } = usePredictionCount();
  const start = count > limit ? count - limit + 1 : 1;
  const queryCount = count > 0 ? Math.min(limit, count) : 0;

  const { data, isLoading, error, refetch } = useReadContract({
    address: PREDICTION_STORE_ADDRESS[CHAIN_ID],
    abi,
    functionName: "getPredictions",
    args: [BigInt(start), BigInt(queryCount || 1)],
    chainId: CHAIN_ID,
    query: { enabled: queryCount > 0, refetchInterval: 15_000 },
  });

  const predictions: ChainPrediction[] = data
    ? (data as ContractPrediction[]).map(decode).reverse() // newest first
    : [];

  return { predictions, total: count, isLoading, error, refetch };
}
