// React hooks: fetch real API data, gracefully degrade to mock data.
// Polls every 30s so the dashboard stays live.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "./api";
import type { PredictionStats } from "./api";
import {
  HEATMAP,
  HEATMAP_ASSETS,
  HEATMAP_CATS,
  KPIS,
  NARRATIVES,
  PREDICTION_STATS,
  PREDICTIONS,
  PROTOCOLS,
  SMART_MONEY,
  TICKER,
  WHALES,
} from "./mock-data";
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

type PollOptions = { intervalMs?: number; enabled?: boolean };

function usePolling<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  opts: PollOptions = {},
) {
  const { intervalMs = 30_000, enabled = true } = opts;
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetch = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      if (mounted.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (mounted.current) {
        setError(e instanceof Error ? e.message : "fetch failed");
        // keep fallback data visible
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!enabled) return;
    fetch();
    const timer = setInterval(fetch, intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [fetch, intervalMs, enabled]);

  return { data, loading, error, refetch: fetch };
}

export function useNarratives() {
  return usePolling(api.fetchNarratives, NARRATIVES);
}

export function useSmartMoney() {
  return usePolling(api.fetchSmartMoney, SMART_MONEY);
}

export function useWhales() {
  return usePolling(api.fetchWhales, WHALES);
}

export function usePredictions() {
  return usePolling(api.fetchPredictions, PREDICTIONS);
}

export function usePredictionStats(): {
  data: PredictionStats;
  loading: boolean;
  error: string | null;
} {
  return usePolling(api.fetchPredictionStats, PREDICTION_STATS);
}

export function useProtocols() {
  return usePolling(api.fetchProtocols, PROTOCOLS);
}

export function usePrices() {
  return usePolling(api.fetchPrices, TICKER);
}

export function useEcosystemKpi() {
  return usePolling(api.fetchEcosystemKpi, KPIS);
}

export function useHeatmap(): {
  data: { categories: string[]; assets: string[]; cells: HeatCell[] };
  loading: boolean;
  error: string | null;
} {
  return usePolling(
    api.fetchHeatmap,
    { categories: HEATMAP_CATS, assets: HEATMAP_ASSETS, cells: HEATMAP },
  );
}
