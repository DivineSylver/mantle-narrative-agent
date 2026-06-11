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
    "Yield": "Yield",
    "Yield Aggregator": "Yield",
    "RWA": "RWA",
    "Derivatives": "DEX",
    "CDP": "Lending",
    "Cross Chain Bridge": "Bridge",
    "Bridge": "Bridge",
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
            mantle_tvl = chain_tvls.get("Mantle")
            if "Mantle" not in chains or not isinstance(mantle_tvl, (int, float)):
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
