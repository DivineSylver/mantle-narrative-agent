"""Layer 2 — Smart Money Engine.

Scores wallets by their historical trade performance over a rolling window:
- Win rate (% closed positions with positive PnL)
- Average ROI per trade
- Realized PnL ($)
- Trade volume and hold duration

A composite `Smart Money Score` (0-100) blends these. Top-N wallets are then
classified Elite / Pro / Active for the UI.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Iterable

from sqlalchemy import select

from app.db.models import WalletProfile, WalletTrade
from app.db.session import session_scope


@dataclass
class TradeStats:
    trades: int = 0
    wins: int = 0
    realized_pnl_usd: float = 0.0
    total_usd: float = 0.0
    hold_days_sum: float = 0.0


def _fifo_realized(trades: Iterable[WalletTrade]) -> TradeStats:
    """Walk a wallet's trades chronologically and compute FIFO-realized PnL per asset."""

    stats = TradeStats()
    by_asset: dict[str, list[tuple[float, float, datetime]]] = defaultdict(list)
    # tuple = (qty_remaining, cost_per_unit_usd, opened_at)

    for t in trades:
        stats.total_usd += t.amount_usd
        if t.side == "BUY":
            unit_cost = t.amount_usd / t.amount if t.amount else 0.0
            by_asset[t.asset].append((t.amount, unit_cost, t.occurred_at))
        elif t.side == "SELL":
            qty_left = t.amount
            sell_unit = t.amount_usd / t.amount if t.amount else 0.0
            lot_pnl = 0.0
            held_days = 0.0
            held_qty = 0.0
            while qty_left > 1e-12 and by_asset[t.asset]:
                lot_qty, lot_cost, lot_opened = by_asset[t.asset][0]
                take = min(lot_qty, qty_left)
                lot_pnl += take * (sell_unit - lot_cost)
                held = (t.occurred_at - lot_opened).total_seconds() / 86400.0
                held_days += held * take
                held_qty += take
                if take >= lot_qty - 1e-12:
                    by_asset[t.asset].pop(0)
                else:
                    by_asset[t.asset][0] = (lot_qty - take, lot_cost, lot_opened)
                qty_left -= take

            stats.trades += 1
            stats.realized_pnl_usd += lot_pnl
            if lot_pnl > 0:
                stats.wins += 1
            if held_qty > 0:
                stats.hold_days_sum += held_days / held_qty
        # STAKE / LP events are ignored for ROI calc but counted toward volume
    return stats


def _composite_score(s: TradeStats) -> float:
    if s.trades < 3:
        return 0.0
    win_rate = s.wins / s.trades
    avg_pnl = s.realized_pnl_usd / max(s.trades, 1)
    pnl_term = min(1.0, max(-1.0, avg_pnl / 50_000.0))  # cap
    volume_term = min(1.0, s.total_usd / 5_000_000.0)
    return round(100 * (0.45 * win_rate + 0.4 * (pnl_term + 1) / 2 + 0.15 * volume_term), 2)


def _classify(score: float) -> str:
    if score >= 75:
        return "Elite"
    if score >= 55:
        return "Pro"
    if score >= 35:
        return "Active"
    return "Unknown"


async def rebuild_scores(window_days: int = 90) -> int:
    """Recompute scores for all wallets touched in the last `window_days`."""

    since = datetime.now(timezone.utc) - timedelta(days=window_days)
    async with session_scope() as session:
        rows = (
            await session.scalars(
                select(WalletTrade).where(WalletTrade.occurred_at >= since).order_by(
                    WalletTrade.wallet, WalletTrade.occurred_at
                )
            )
        ).all()

        groups: dict[str, list[WalletTrade]] = defaultdict(list)
        for t in rows:
            groups[t.wallet].append(t)

        touched = 0
        for wallet, trades in groups.items():
            s = _fifo_realized(trades)
            score = _composite_score(s)
            avg_roi = (s.realized_pnl_usd / s.total_usd * 100.0) if s.total_usd else 0.0
            avg_hold = (s.hold_days_sum / s.trades) if s.trades else 0.0
            win_rate = (s.wins / s.trades * 100.0) if s.trades else 0.0

            existing = await session.get(WalletProfile, wallet)
            if existing is None:
                existing = WalletProfile(address=wallet)
                session.add(existing)
            existing.win_rate = round(win_rate, 2)
            existing.avg_roi = round(avg_roi, 2)
            existing.avg_hold_days = round(avg_hold, 2)
            existing.realized_pnl_usd = round(s.realized_pnl_usd, 2)
            existing.trades_count = s.trades
            existing.score = score
            existing.classification = _classify(score)
            touched += 1
        return touched


async def top_smart_money(limit: int = 25) -> list[WalletProfile]:
    async with session_scope() as session:
        result = await session.scalars(
            select(WalletProfile).order_by(WalletProfile.score.desc()).limit(limit)
        )
        return list(result.all())
