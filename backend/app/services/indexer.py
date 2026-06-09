"""Indexer — pulls Mantle transfers for tracked assets and writes WhaleMoves + WalletTrades.

Designed as a polling loop: each tick advances `from_block → head`, dedupes by tx hash,
classifies the move, and persists.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal

import structlog
from sqlalchemy import select

from app.chain.mantle import Erc20Transfer, get_client
from app.config import get_settings
from app.db.models import WalletTrade, WhaleMove
from app.db.session import session_scope
from app.services.pricing import get_price_usd

log = structlog.get_logger()

WHALE_THRESHOLD_USD = 250_000.0
TRACKED_DECIMALS: dict[str, int] = {
    # populated by registry on startup; fallback 18
}


@dataclass(frozen=True)
class TrackedAsset:
    symbol: str
    address: str
    decimals: int = 18


def tracked_assets() -> list[TrackedAsset]:
    s = get_settings()
    return [
        TrackedAsset("MNT", s.mnt_address, 18),
        TrackedAsset("mETH", s.meth_address, 18),
        TrackedAsset("fBTC", s.fbtc_address, 8),
        TrackedAsset("USDY", s.usdy_address, 18),
        TrackedAsset("USDC", s.usdc_address, 6),
    ]


def classify(t: Erc20Transfer) -> str:
    """Heuristic: zero-from = mint/bridge_in, zero-to = burn/bridge_out, else INFLOW from wallet POV."""
    if t.from_addr == "0x0000000000000000000000000000000000000000":
        return "BRIDGE_IN"
    if t.to_addr == "0x0000000000000000000000000000000000000000":
        return "BRIDGE_OUT"
    return "INFLOW"


async def index_window(from_block: int, to_block: int) -> int:
    """Index a single block window. Returns rows inserted."""

    client = get_client()
    inserted = 0
    for asset in tracked_assets():
        try:
            transfers = await client.erc20_transfers(asset.address, from_block, to_block)
        except Exception as e:  # noqa: BLE001
            log.warning("transfer_fetch_failed", asset=asset.symbol, err=str(e))
            continue

        price = await get_price_usd(asset.symbol)
        async with session_scope() as session:
            for t in transfers:
                amount = Decimal(t.value) / (Decimal(10) ** asset.decimals)
                amount_usd = float(amount * Decimal(price))
                if amount_usd < WHALE_THRESHOLD_USD:
                    continue

                # Dedupe by (tx_hash, asset, side)
                existing = await session.scalar(
                    select(WhaleMove.id).where(
                        WhaleMove.tx_hash == t.tx_hash, WhaleMove.asset == asset.symbol
                    )
                )
                if existing is not None:
                    continue

                move = WhaleMove(
                    wallet=t.to_addr,
                    move_type=classify(t),
                    asset=asset.symbol,
                    amount_usd=amount_usd,
                    tx_hash=t.tx_hash,
                    block_number=t.block_number,
                    occurred_at=datetime.now(timezone.utc),
                )
                trade = WalletTrade(
                    wallet=t.to_addr,
                    asset=asset.symbol,
                    side="BUY",
                    amount=float(amount),
                    amount_usd=amount_usd,
                    tx_hash=t.tx_hash,
                    block_number=t.block_number,
                    occurred_at=datetime.now(timezone.utc),
                )
                session.add_all([move, trade])
                inserted += 1
    return inserted


async def run_loop(interval_seconds: int = 30, window_blocks: int = 200) -> None:
    """Continuously catch up the indexer from chain head."""

    client = get_client()
    head = await client.block_number()
    cursor = max(0, head - window_blocks)
    log.info("indexer_start", head=head, cursor=cursor)

    while True:
        try:
            head = await client.block_number()
            if cursor >= head:
                await asyncio.sleep(interval_seconds)
                continue
            stop = min(cursor + window_blocks, head)
            n = await index_window(cursor, stop)
            log.info("indexer_window", from_block=cursor, to_block=stop, rows=n)
            cursor = stop + 1
        except Exception as e:  # noqa: BLE001
            log.exception("indexer_error", err=str(e))
            await asyncio.sleep(interval_seconds)
