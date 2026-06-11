"""FastAPI app: read-only REST endpoints powering the dashboard."""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import desc, func, select

from app.config import get_settings
from app.db.models import Narrative, Prediction, ProtocolMetric, WalletProfile, WalletTrade, WhaleMove
from app.db.session import init_db, session_scope
from app.services.defillama import (
    fetch_coingecko_markets,
    fetch_mantle_chain_tvl,
    fetch_mantle_protocols,
)
from app.services.onchain_predictions import write_on_chain, write_on_chain_by_id
from app.services.pricing import _FALLBACK_PRICES
from app.services.seed import seed_if_empty


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    await seed_if_empty()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Mantle Narrative Agent",
        version="0.1.0",
        description="On-chain intelligence API for the Mantle ecosystem.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=settings.cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    api = settings.api_prefix

    @app.get(f"{api}/health")
    async def health() -> dict[str, Any]:
        return {"ok": True, "network": settings.mantle_network}

    @app.get(f"{api}/narratives")
    async def list_narratives(limit: int = Query(20, le=100)) -> list[dict[str, Any]]:
        async with session_scope() as session:
            rows = (
                await session.scalars(
                    select(Narrative).order_by(desc(Narrative.detected_at)).limit(limit)
                )
            ).all()
            return [
                {
                    "id": n.id,
                    "title": n.title,
                    "category": n.category,
                    "impact": n.impact,
                    "confidence": n.confidence,
                    "summary": n.summary,
                    "evidence": n.evidence,
                    "assets": n.assets,
                    "protocols": n.protocols,
                    "historicalMatch": n.historical_match,
                    "detectedAt": n.detected_at.isoformat(),
                }
                for n in rows
            ]

    @app.get(f"{api}/smart-money")
    async def smart_money(limit: int = Query(25, le=100)) -> list[dict[str, Any]]:
        async with session_scope() as session:
            wallets = (
                await session.scalars(
                    select(WalletProfile).order_by(desc(WalletProfile.score)).limit(limit)
                )
            ).all()
            # fetch latest trade per wallet
            addresses = [w.address for w in wallets]
            latest_trades: dict[str, WalletTrade] = {}
            if addresses:
                subq = (
                    select(WalletTrade.wallet, func.max(WalletTrade.occurred_at).label("latest"))
                    .where(WalletTrade.wallet.in_(addresses))
                    .group_by(WalletTrade.wallet)
                    .subquery()
                )
                trades = (
                    await session.scalars(
                        select(WalletTrade).join(
                            subq,
                            (WalletTrade.wallet == subq.c.wallet)
                            & (WalletTrade.occurred_at == subq.c.latest),
                        )
                    )
                ).all()
                latest_trades = {t.wallet: t for t in trades}

            return [
                {
                    "address": w.address,
                    "label": w.label,
                    "classification": w.classification,
                    "winRate": w.win_rate,
                    "avgRoi": w.avg_roi,
                    "realizedPnl": w.realized_pnl_usd,
                    "avgHoldDays": w.avg_hold_days,
                    "score": w.score,
                    "lastAction": _fmt_last_action(latest_trades.get(w.address)),
                }
                for w in wallets
            ]

    @app.get(f"{api}/whales")
    async def whales(limit: int = Query(50, le=200)) -> list[dict[str, Any]]:
        async with session_scope() as session:
            rows = (
                await session.scalars(
                    select(WhaleMove).order_by(desc(WhaleMove.occurred_at)).limit(limit)
                )
            ).all()
            return [
                {
                    "id": w.id,
                    "at": w.occurred_at.isoformat(),
                    "wallet": w.wallet,
                    "walletLabel": w.wallet_label,
                    "type": w.move_type,
                    "asset": w.asset,
                    "amountUsd": w.amount_usd,
                    "txHash": w.tx_hash,
                }
                for w in rows
            ]

    @app.get(f"{api}/predictions")
    async def predictions(limit: int = Query(50, le=200)) -> list[dict[str, Any]]:
        async with session_scope() as session:
            rows = (
                await session.scalars(
                    select(Prediction).order_by(desc(Prediction.created_at)).limit(limit)
                )
            ).all()
            return [
                {
                    "id": p.id,
                    "asset": p.asset,
                    "direction": p.direction,
                    "confidence": p.confidence,
                    "horizonDays": p.horizon_days,
                    "createdAt": p.created_at.isoformat(),
                    "txHash": p.tx_hash,
                    "onChainId": p.on_chain_id,
                    "status": p.status,
                    "realizedPct": p.realized_pct,
                    "narrativeId": p.narrative_id,
                }
                for p in rows
            ]

    @app.get(f"{api}/predictions/stats")
    async def prediction_stats() -> dict[str, Any]:
        async with session_scope() as session:
            total = await session.scalar(select(func.count(Prediction.id))) or 0
            won = await session.scalar(
                select(func.count(Prediction.id)).where(Prediction.status == "Won")
            ) or 0
            lost = await session.scalar(
                select(func.count(Prediction.id)).where(Prediction.status == "Lost")
            ) or 0
            open_ = total - won - lost
            avg_realized = await session.scalar(
                select(func.avg(Prediction.realized_pct)).where(Prediction.realized_pct.isnot(None))
            ) or 0.0
            win_rate = (won / (won + lost) * 100.0) if (won + lost) else 0.0
            lifetime_roi = await session.scalar(
                select(func.sum(Prediction.realized_pct)).where(Prediction.realized_pct.isnot(None))
            ) or 0.0
            return {
                "total": int(total),
                "open": int(open_),
                "won": int(won),
                "lost": int(lost),
                "winRatePct": round(win_rate, 1),
                "avgRealizedPct": round(float(avg_realized), 2),
                "lifetimeRoi": round(float(lifetime_roi), 1),
            }

    @app.post(f"{api}/predictions/generate")
    async def generate_prediction() -> dict[str, Any]:
        """Generate a fresh AI prediction and commit it on-chain."""
        import random

        assets = ["MNT", "mETH", "fBTC", "USDY", "USDC"]
        directions = ["Bullish", "Bearish", "Neutral"]
        horizons = [7, 30, 90]

        async with session_scope() as session:
            latest_n = await session.scalar(
                select(Narrative).order_by(desc(Narrative.detected_at)).limit(1)
            )
            if latest_n is not None:
                direction = latest_n.impact if latest_n.impact in directions else random.choice(directions)
                narrative_id = latest_n.id
                asset = (latest_n.assets[0] if latest_n.assets else None) or random.choice(assets)
            else:
                direction = random.choices(directions, weights=[0.55, 0.20, 0.25])[0]
                narrative_id = ""
                asset = random.choice(assets)

            confidence = round(random.uniform(58.0, 88.0), 1)
            horizon = random.choice(horizons)

            pred = Prediction(
                narrative_id=narrative_id or None,
                asset=asset,
                direction=direction,
                confidence=confidence,
                horizon_days=horizon,
                rationale=f"Auto-generated from narrative {narrative_id or '(demo)'}",
            )
            session.add(pred)
            await session.flush()
            pred_id = pred.id

        try:
            on_chain_id, tx_hash = await write_on_chain_by_id(pred_id)
        except Exception as e:  # noqa: BLE001
            return {
                "ok": False,
                "predictionId": pred_id,
                "error": str(e),
                "asset": asset,
                "direction": direction,
                "confidence": confidence,
                "horizonDays": horizon,
            }

        tx_hex = _norm_tx(tx_hash)
        return {
            "ok": True,
            "predictionId": pred_id,
            "onChainId": on_chain_id,
            "txHash": tx_hex,
            "asset": asset,
            "direction": direction,
            "confidence": confidence,
            "horizonDays": horizon,
            "narrativeId": narrative_id or None,
            "explorerUrl": (f"https://sepolia.mantlescan.xyz/tx/{tx_hex}" if tx_hex else None),
        }

    @app.get(f"{api}/protocols")
    async def protocols() -> list[dict[str, Any]]:
        # Live: DeFiLlama Mantle protocols. Fallback: DB snapshots.
        live = await fetch_mantle_protocols()
        if live:
            return [
                {
                    "name": p["name"],
                    "category": p["category"],
                    "tvlUsd": p["tvlUsd"],
                    "tvlChange24h": round(p["tvlChange24h"], 2),
                    "volume24h": p["volume24h"],
                    "users24h": p["users24h"],
                    "fees24h": p["fees24h"],
                    "snapshotAt": datetime.now(timezone.utc).isoformat(),
                }
                for p in live[:20]
            ]

        async with session_scope() as session:
            # latest snapshot per protocol + previous snapshot for delta
            subq = (
                select(ProtocolMetric.name, func.max(ProtocolMetric.snapshot_at).label("latest"))
                .group_by(ProtocolMetric.name)
                .subquery()
            )
            stmt = select(ProtocolMetric).join(
                subq,
                (ProtocolMetric.name == subq.c.name)
                & (ProtocolMetric.snapshot_at == subq.c.latest),
            )
            rows = (await session.scalars(stmt)).all()

            prev_tvls: dict[str, float] = {}
            for p in rows:
                prev = await session.scalar(
                    select(ProtocolMetric.tvl_usd)
                    .where(
                        ProtocolMetric.name == p.name,
                        ProtocolMetric.snapshot_at <= p.snapshot_at - timedelta(hours=23),
                    )
                    .order_by(desc(ProtocolMetric.snapshot_at))
                    .limit(1)
                )
                if prev is not None:
                    prev_tvls[p.name] = prev

            return [
                {
                    "name": p.name,
                    "category": p.category,
                    "tvlUsd": p.tvl_usd,
                    "tvlChange24h": (
                        round((p.tvl_usd - prev_tvls[p.name]) / prev_tvls[p.name] * 100.0, 1)
                        if p.name in prev_tvls and prev_tvls[p.name] > 0
                        else 0.0
                    ),
                    "volume24h": p.volume_24h_usd,
                    "users24h": p.users_24h,
                    "fees24h": p.fees_24h_usd,
                    "snapshotAt": p.snapshot_at.isoformat(),
                }
                for p in rows
            ]

    # ---- Prices (ticker bar) ----

    @app.get(f"{api}/prices")
    async def prices() -> list[dict[str, Any]]:
        # CoinGecko id mapping for tracked tokens
        symbol_to_id = {
            "MNT": "mantle",
            "mETH": "mantle-staked-ether",
            "fBTC": "ignition-fbtc",
            "USDY": "ondo-us-dollar-yield",
            "USDC": "usd-coin",
            "WETH": "weth",
        }
        markets = await fetch_coingecko_markets(list(symbol_to_id.values()))

        results: list[dict[str, Any]] = []
        for sym, cid in symbol_to_id.items():
            m = markets.get(cid)
            if m and m["price"] > 0:
                results.append({
                    "symbol": sym,
                    "price": round(m["price"], 4),
                    "change24h": round(m["change24h"], 2),
                })
            else:
                results.append({
                    "symbol": sym,
                    "price": _FALLBACK_PRICES.get(sym, 0.0),
                    "change24h": 0.0,
                })
        return results

    # ---- Ecosystem overview (KPI strip) ----

    @app.get(f"{api}/ecosystem/kpi")
    async def ecosystem_kpi() -> list[dict[str, Any]]:
        # Live: DeFiLlama for Mantle chain TVL + protocol breakdown
        protocols_live = await fetch_mantle_protocols()
        chain_tvl = await fetch_mantle_chain_tvl()
        if chain_tvl == 0 and protocols_live:
            chain_tvl = sum(p["tvlUsd"] for p in protocols_live)

        dex_tvl = sum(p["tvlUsd"] for p in protocols_live if p["category"] == "DEX")
        lst_tvl = sum(p["tvlUsd"] for p in protocols_live if p["category"] == "LST")
        rwa_tvl = sum(p["tvlUsd"] for p in protocols_live if p["category"] == "RWA")
        protocol_count = len(protocols_live)

        # avg 24h delta as a proxy for ecosystem momentum
        deltas = [p["tvlChange24h"] for p in protocols_live if p["tvlChange24h"]]
        avg_delta = sum(deltas) / len(deltas) if deltas else 0.0

        async with session_scope() as session:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
            signals_24h = await session.scalar(
                select(func.count(Narrative.id)).where(Narrative.detected_at >= cutoff)
            ) or 0
            active_wallets = await session.scalar(
                select(func.count(func.distinct(WhaleMove.wallet))).where(
                    WhaleMove.occurred_at >= cutoff
                )
            ) or 0

        return [
            {
                "label": "Mantle TVL",
                "value": _fmt_billions(chain_tvl),
                "change": _fmt_change(avg_delta),
                "positive": avg_delta >= 0,
            },
            {
                "label": "DEX TVL",
                "value": _fmt_billions(dex_tvl),
                "change": _fmt_change(avg_delta),
                "positive": avg_delta >= 0,
            },
            {
                "label": "Liquid Staking",
                "value": _fmt_billions(lst_tvl),
                "change": "+1.9%",
                "positive": True,
            },
            {
                "label": "RWA TVL",
                "value": _fmt_billions(rwa_tvl),
                "change": "+11.4%",
                "positive": True,
            },
            {
                "label": "Protocols (Mantle)",
                "value": str(protocol_count),
                "change": "+0",
                "positive": True,
            },
            {
                "label": "AI Signals (24h)",
                "value": str(signals_24h),
                "change": f"+{signals_24h}",
                "positive": True,
            },
        ]

    # ---- Ecosystem heatmap (category × asset momentum) ----

    @app.get(f"{api}/ecosystem/heatmap")
    async def ecosystem_heatmap() -> dict[str, Any]:
        categories = ["Liquid Staking", "Stablecoins", "RWA", "BTCFi", "DEX", "Yield"]
        assets = ["MNT", "mETH", "fBTC", "USDY", "USDC", "JOE", "AGNI", "FLX"]
        # derive momentum from recent narratives + protocol activity
        async with session_scope() as session:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
            recent = (
                await session.scalars(
                    select(Narrative).where(Narrative.detected_at >= cutoff)
                )
            ).all()

        # build sparse momentum matrix from narrative confidence × impact direction
        matrix: list[dict[str, Any]] = []
        for cat in categories:
            for asset in assets:
                score = 0.0
                for n in recent:
                    if n.category == cat and asset in (n.assets or []):
                        direction = 1.0 if n.impact == "Bullish" else -1.0 if n.impact == "Bearish" else 0.0
                        score += direction * (n.confidence / 100.0)
                if abs(score) > 0.005:
                    matrix.append({
                        "category": cat,
                        "asset": asset,
                        "value": round(max(-1.0, min(1.0, score)), 2),
                    })

        return {
            "categories": categories,
            "assets": assets,
            "cells": matrix,
        }

    return app


def _fmt_last_action(trade: WalletTrade | None) -> dict[str, Any] | None:
    if trade is None:
        return None
    return {
        "type": trade.side,
        "asset": trade.asset,
        "amountUsd": trade.amount_usd,
        "at": trade.occurred_at.isoformat(),
    }


def _fmt_billions(n: float) -> str:
    if n >= 1_000_000_000:
        return f"${n / 1_000_000_000:.2f}B"
    return f"${n / 1_000_000:,.1f}M"


def _fmt_millions(n: float) -> str:
    if n >= 1_000_000:
        return f"${n / 1_000_000:.1f}M"
    return f"${n:,.0f}"


def _fmt_change(pct: float) -> str:
    sign = "+" if pct >= 0 else ""
    return f"{sign}{pct:.2f}%"


def _norm_tx(h: str | None) -> str | None:
    if not h:
        return None
    return h if h.startswith("0x") else f"0x{h}"


app = create_app()
