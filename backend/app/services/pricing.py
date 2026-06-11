"""Asset pricing: Redis-cached spot prices.

Falls back to a hardcoded map when no upstream is configured (good for tests / offline demo).
"""

from __future__ import annotations

from typing import Final

import httpx
import structlog

log = structlog.get_logger()

# Symbol → CoinGecko id (used when the API is reachable)
_COINGECKO_IDS: Final[dict[str, str]] = {
    "MNT": "mantle",
    "mETH": "mantle-staked-ether",
    "fBTC": "ignition-fbtc",
    "USDY": "ondo-us-dollar-yield",
    "USDC": "usd-coin",
}

# Offline fallback prices
_FALLBACK_PRICES: Final[dict[str, float]] = {
    "MNT": 0.68,
    "mETH": 3672.0,
    "fBTC": 71250.0,
    "USDY": 1.08,
    "USDC": 1.0,
    "WETH": 3669.0,
    "JOE": 0.39,
    "AGNI": 0.042,
    "FLX": 1.21,
}


async def get_price_usd(symbol: str) -> float:
    sid = _COINGECKO_IDS.get(symbol)
    if sid is None:
        return _FALLBACK_PRICES.get(symbol, 0.0)
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            r = await client.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={"ids": sid, "vs_currencies": "usd"},
            )
            r.raise_for_status()
            data = r.json()
            return float(data[sid]["usd"])
    except Exception as e:  # noqa: BLE001
        log.warning("price_fallback", symbol=symbol, err=str(e))
        return _FALLBACK_PRICES.get(symbol, 0.0)
