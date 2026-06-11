"""DeFiLlama integration: pulls live Mantle ecosystem data.

Public API, no auth required. Used to surface real numbers on the dashboard
without needing the local indexer to have populated the DB.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Final

import httpx
import structlog

log = structlog.get_logger()

_LLAMA_BASE: Final[str] = "https://api.llama.fi"
_CACHE_TTL_SECONDS: Final[int] = 90

# Simple in-process TTL cache: {key: (expires_at_epoch, value)}
_cache: dict[str, tuple[float, Any]] = {}
_locks: dict[str, asyncio.Lock] = {}


def _cached(key: str) -> Any | None:
    entry = _cache.get(key)
    if entry is None:
        return None
    expires, value = entry
    if expires < time.time():
        return None
    return value


def _store(key: str, value: Any) -> None:
    _cache[key] = (time.time() + _CACHE_TTL_SECONDS, value)


def _lock(key: str) -> asyncio.Lock:
    lock = _locks.get(key)
    if lock is None:
        lock = asyncio.Lock()
        _locks[key] = lock
    return lock

# DeFiLlama category -> our category taxonomy
_CATEGORY_MAP: Final[dict[str, str]] = {
    "Dexs": "DEX",
    "DEX Aggregator": "DEX",
    "Lending": "Lending",
    "Liquid Staking": "LST",
    "Liquid Restaking": "LST",
    "Restaking": "LST",
    "Yield": "Yield",
    "Yield Aggregator": "Yield",
    "RWA": "RWA",
    "Derivatives": "DEX",
    "CDP": "Lending",
    "Cross Chain Bridge": "Bridge",
    "Bridge": "Bridge",
    "Anchor BTC": "BTCFi",
    "BTC LSTs": "BTCFi",
}


async def fetch_mantle_protocols(min_tvl_usd: float = 500_000.0) -> list[dict[str, Any]]:
    """Return Mantle protocols with TVL, 24h change, category. Live from DeFiLlama (90s cache)."""

    cache_key = f"mantle_protocols:{min_tvl_usd}"
    cached = _cached(cache_key)
    if cached is not None:
        return cached

    async with _lock(cache_key):
        cached = _cached(cache_key)
        if cached is not None:
            return cached
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(f"{_LLAMA_BASE}/protocols")
                r.raise_for_status()
                data = r.json()
        except Exception as e:  # noqa: BLE001
            log.warning("llama_protocols_failed", err=str(e))
            return []

        out: list[dict[str, Any]] = []
        for p in data:
            chains = p.get("chains") or []
            chain_tvls = p.get("chainTvls") or {}
            # Sum the base Mantle bucket plus sub-buckets (Mantle-staking, Mantle-borrowed, etc.)
            mantle_tvl = 0.0
            saw_mantle = False
            for key, value in chain_tvls.items():
                if (key == "Mantle" or key.startswith("Mantle-")) and isinstance(value, (int, float)):
                    mantle_tvl += float(value)
                    saw_mantle = True
            if not saw_mantle and "Mantle" not in chains:
                continue
            if mantle_tvl < min_tvl_usd:
                continue
            raw_cat = p.get("category") or ""
            category = _CATEGORY_MAP.get(raw_cat, raw_cat or "Other")
            out.append({
                "name": p.get("name") or "Unknown",
                "category": category,
                "tvlUsd": float(mantle_tvl),
                "tvlChange24h": float(p.get("change_1d") or 0.0),
                "volume24h": 0.0,
                "users24h": 0,
                "fees24h": 0.0,
            })
        out.sort(key=lambda r: r["tvlUsd"], reverse=True)
        _store(cache_key, out)
        return out


async def fetch_mantle_chain_tvl() -> float:
    """Aggregate Mantle TVL across all protocols. Live from DeFiLlama (90s cache)."""

    cache_key = "mantle_chain_tvl"
    cached = _cached(cache_key)
    if cached is not None:
        return cached

    async with _lock(cache_key):
        cached = _cached(cache_key)
        if cached is not None:
            return cached
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(f"{_LLAMA_BASE}/v2/chains")
                r.raise_for_status()
                for chain in r.json():
                    if chain.get("name") == "Mantle":
                        value = float(chain.get("tvl") or 0.0)
                        _store(cache_key, value)
                        return value
        except Exception as e:  # noqa: BLE001
            log.warning("llama_chain_tvl_failed", err=str(e))
        _store(cache_key, 0.0)
        return 0.0


async def fetch_mantle_chain_tvl_change_24h() -> float:
    """24h % change of Mantle chain TVL, from DeFiLlama historical series."""

    cache_key = "mantle_chain_tvl_change_24h"
    cached = _cached(cache_key)
    if cached is not None:
        return cached

    async with _lock(cache_key):
        cached = _cached(cache_key)
        if cached is not None:
            return cached
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(f"{_LLAMA_BASE}/v2/historicalChainTvl/Mantle")
                r.raise_for_status()
                series = r.json()
        except Exception as e:  # noqa: BLE001
            log.warning("llama_chain_tvl_hist_failed", err=str(e))
            _store(cache_key, 0.0)
            return 0.0

        if not isinstance(series, list) or len(series) < 2:
            _store(cache_key, 0.0)
            return 0.0
        try:
            today_tvl = float(series[-1]["tvl"])
            prev_tvl = float(series[-2]["tvl"])
        except (KeyError, TypeError, ValueError):
            _store(cache_key, 0.0)
            return 0.0
        if prev_tvl <= 0:
            _store(cache_key, 0.0)
            return 0.0
        delta = (today_tvl - prev_tvl) / prev_tvl * 100.0
        _store(cache_key, delta)
        return delta


async def fetch_llama_coin_markets(coin_ids: list[str]) -> dict[str, dict[str, float]]:
    """Spot price + 24h change for CoinGecko coin ids, via DeFiLlama coins API.

    DeFiLlama's coins API is uncapped and uses CoinGecko ids natively under the
    `coingecko:<id>` namespace. Far more reliable from a shared cloud IP than
    hitting CoinGecko directly.
    """

    if not coin_ids:
        return {}

    cache_key = f"llama_coins:{','.join(sorted(coin_ids))}"
    cached = _cached(cache_key)
    if cached is not None:
        return cached

    async with _lock(cache_key):
        cached = _cached(cache_key)
        if cached is not None:
            return cached

        keys = ",".join(f"coingecko:{cid}" for cid in coin_ids)
        prices: dict[str, float] = {}
        changes: dict[str, float] = {}
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                p = await client.get(f"https://coins.llama.fi/prices/current/{keys}")
                p.raise_for_status()
                price_data = (p.json() or {}).get("coins") or {}
                for k, v in price_data.items():
                    cid = k.split(":", 1)[1] if ":" in k else k
                    if isinstance(v, dict) and isinstance(v.get("price"), (int, float)):
                        prices[cid] = float(v["price"])

                c = await client.get(f"https://coins.llama.fi/percentage/{keys}?period=24h")
                c.raise_for_status()
                change_data = (c.json() or {}).get("coins") or {}
                for k, v in change_data.items():
                    cid = k.split(":", 1)[1] if ":" in k else k
                    if isinstance(v, (int, float)):
                        changes[cid] = float(v)
        except Exception as e:  # noqa: BLE001
            log.warning("llama_coins_failed", err=str(e))
            return {}

        out = {
            cid: {"price": prices[cid], "change24h": changes.get(cid, 0.0)}
            for cid in coin_ids
            if cid in prices
        }
        _store(cache_key, out)
        return out


async def fetch_coingecko_markets(coin_ids: list[str]) -> dict[str, dict[str, float]]:
    """Spot price + 24h change for a batch of CoinGecko coin ids."""

    if not coin_ids:
        return {}
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={
                    "ids": ",".join(coin_ids),
                    "vs_currencies": "usd",
                    "include_24hr_change": "true",
                },
            )
            r.raise_for_status()
            data = r.json()
            return {
                cid: {
                    "price": float(data[cid].get("usd") or 0.0),
                    "change24h": float(data[cid].get("usd_24h_change") or 0.0),
                }
                for cid in coin_ids
                if cid in data
            }
    except Exception as e:  # noqa: BLE001
        log.warning("coingecko_markets_failed", err=str(e))
        return {}
