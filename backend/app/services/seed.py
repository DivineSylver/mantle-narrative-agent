"""Demo seed data — populates the DB with realistic-looking Mantle ecosystem entries
so the dashboard has narratives, wallets, and whale flows to display even before
the full indexer + GPT-4o pipeline is wired against the live RPC.

Idempotent: skips inserts if any row of each type already exists.
Run automatically on app startup (lifespan) when the table is empty.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone
from typing import Iterable

import structlog
from sqlalchemy import select, func

from app.db.models import Narrative, WalletProfile, WalletTrade, WhaleMove
from app.db.session import session_scope

log = structlog.get_logger()


WALLETS = [
    ("0x9a4f3b1c2d8e5a7b6f0c1d3e4f5a6b7c8d9e0a1b", "Elite #001", "Elite", 76, 215, 4_120_000, 38, 92.5),
    ("0x6b2c8d1e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c", "Whale Alpha", "Elite", 71, 184, 3_640_000, 22, 88.1),
    ("0x3e5f7a9b1c2d4e6f8a0b2c4d6e8f0a1b3c5d7e9f", "Yield Hunter", "Pro", 68, 142, 1_280_000, 14, 78.3),
    ("0x1d4f6a8b0c2e4f6a8b0c2e4f6a8b0c2e4f6a8b0c", "Treasury #07", "Pro", 64, 118, 942_000, 67, 72.0),
    ("0xa1c3e5f7b9d1c3e5f7b9d1c3e5f7b9d1c3e5f7b9", None, "Active", 59, 87, 412_000, 9, 61.5),
    ("0x8c4e7d2a1f3b5c6d8e9a0b2c4d6e8f0a1b3c5d7e", "MNT Maxi", "Elite", 74, 198, 2_810_000, 31, 85.7),
    ("0xfedcba9876543210fedcba9876543210fedcba98", None, "Active", 55, 64, 218_000, 12, 56.2),
]

NARRATIVES = [
    {
        "id": "NR-184",
        "title": "Institutional Yield Rotation",
        "category": "Yield",
        "impact": "Bullish",
        "confidence": 82,
        "summary": "Stablecoin reserves are rotating into yield-bearing Mantle assets. Three Elite Smart Money wallets accumulated mETH while liquidity migrated out of volatile pairs.",
        "evidence": [
            "Stablecoin inflows +23.1% (24h)",
            "mETH deposits +17.4%",
            "3 Elite wallets accumulated $4.2M mETH",
            "Liquidity migrated from MNT/USDC into mETH/USDC",
        ],
        "assets": ["mETH", "USDY", "USDC"],
        "protocols": ["Merchant Moe", "Agni Finance"],
        "historical_match": {"label": "Apr 2025 Yield Rotation", "similarity": 0.78},
        "minutes_ago": 18,
    },
    {
        "id": "NR-183",
        "title": "BTCFi Liquidity Bootstrapping",
        "category": "BTCFi",
        "impact": "Bullish",
        "confidence": 71,
        "summary": "fBTC liquidity depth on Mantle DEXs jumped 31% in 48h. Whale accumulators concentrated in two pools with rising borrow utilization.",
        "evidence": [
            "fBTC TVL +31% (48h)",
            "Borrow utilization rose 22% → 47%",
            "2 whales accumulated 38 fBTC",
            "Bridge inflows from Bitcoin L2s spiked",
        ],
        "assets": ["fBTC"],
        "protocols": ["Agni Finance", "Fluxion"],
        "historical_match": {"label": "Feb 2025 BTCFi Wave", "similarity": 0.66},
        "minutes_ago": 42,
    },
    {
        "id": "NR-182",
        "title": "RWA Adoption Curve Steepening",
        "category": "RWA",
        "impact": "Bullish",
        "confidence": 64,
        "summary": "USDY supply on Mantle expanded 12% week-over-week. Tokenized treasury demand from on-chain treasuries correlates with falling DeFi yields on majors.",
        "evidence": [
            "USDY supply +12% WoW",
            "5 DAOs added USDY to treasury",
            "Avg position size $284k — institutional cohort",
        ],
        "assets": ["USDY"],
        "protocols": ["Ondo Yield Assets"],
        "historical_match": None,
        "minutes_ago": 95,
    },
    {
        "id": "NR-181",
        "title": "DEX Liquidity Concentration Risk",
        "category": "DEX",
        "impact": "Bearish",
        "confidence": 58,
        "summary": "Top-3 wallets now control 41% of Merchant Moe MNT/USDC liquidity. Withdrawal-side slippage on $250k+ swaps degraded 38 bps overnight.",
        "evidence": [
            "LP HHI rose 0.18 → 0.27",
            "Top-3 LP share: 28% → 41%",
            "$250k swap slippage: 0.91% → 1.29%",
        ],
        "assets": ["MNT", "USDC"],
        "protocols": ["Merchant Moe"],
        "historical_match": None,
        "minutes_ago": 180,
    },
    {
        "id": "NR-180",
        "title": "mETH Re-staking Momentum",
        "category": "Liquid Staking",
        "impact": "Bullish",
        "confidence": 76,
        "summary": "mETH supply on Mantle hit ATH. Re-staking deposits onto Fluxion grew 4.1× MoM while validator queue extended.",
        "evidence": [
            "mETH supply ATH (412,840)",
            "Re-stake deposits 4.1× MoM",
            "Validator queue: 6.2 days → 9.8 days",
        ],
        "assets": ["mETH"],
        "protocols": ["Fluxion", "Mantle LSP"],
        "historical_match": {"label": "Jan 2025 LST Surge", "similarity": 0.71},
        "minutes_ago": 305,
    },
]


WHALE_TYPES = ["INFLOW", "OUTFLOW", "SWAP", "BRIDGE_IN", "BRIDGE_OUT", "STAKE"]
WHALE_ASSETS = ["mETH", "USDC", "MNT", "fBTC", "USDY"]


def _make_whales(now: datetime, wallets: list[tuple]) -> Iterable[WhaleMove]:
    seed_rng = random.Random(20260608)
    for i in range(20):
        wallet, label, _, _, _, _, _, _ = seed_rng.choice(wallets)
        yield WhaleMove(
            wallet=wallet,
            wallet_label=label,
            move_type=seed_rng.choice(WHALE_TYPES),
            asset=seed_rng.choice(WHALE_ASSETS),
            amount_usd=round(seed_rng.uniform(280_000, 2_400_000), 2),
            tx_hash="0x" + "".join(seed_rng.choice("0123456789abcdef") for _ in range(64)),
            block_number=74_812_000 + i,
            occurred_at=now - timedelta(minutes=4 + i * 8),
        )


def _make_trades(now: datetime, wallets: list[tuple]) -> Iterable[WalletTrade]:
    seed_rng = random.Random(20260608)
    for i in range(len(wallets)):
        wallet, _, _, _, _, _, _, _ = wallets[i]
        side = seed_rng.choice(["BUY", "ADD_LP", "STAKE", "SELL"])
        asset = seed_rng.choice(WHALE_ASSETS)
        amount_usd = round(seed_rng.uniform(95_000, 1_220_000), 2)
        yield WalletTrade(
            wallet=wallet,
            asset=asset,
            side=side,
            amount=amount_usd / 100.0,  # decorative
            amount_usd=amount_usd,
            tx_hash="0x" + "".join(seed_rng.choice("0123456789abcdef") for _ in range(64)),
            block_number=74_811_900 + i,
            occurred_at=now - timedelta(minutes=12 + i * 17),
        )


async def seed_if_empty() -> None:
    """Insert demo rows if the relevant tables are empty."""
    now = datetime.now(timezone.utc)

    async with session_scope() as session:
        existing_wallets = await session.scalar(select(func.count(WalletProfile.address)))
        if not existing_wallets:
            for addr, label, cls, win_rate, avg_roi, pnl, hold_days, score in WALLETS:
                session.add(
                    WalletProfile(
                        address=addr,
                        label=label,
                        classification=cls,
                        win_rate=float(win_rate),
                        avg_roi=float(avg_roi),
                        avg_hold_days=float(hold_days),
                        realized_pnl_usd=float(pnl),
                        trades_count=20 + (score % 10),
                        score=float(score),
                    )
                )
            for trade in _make_trades(now, WALLETS):
                session.add(trade)
            log.info("seeded_wallets", count=len(WALLETS))

        existing_whales = await session.scalar(select(func.count(WhaleMove.id)))
        if not existing_whales:
            for move in _make_whales(now, WALLETS):
                session.add(move)
            log.info("seeded_whales", count=20)

        existing_narratives = await session.scalar(select(func.count(Narrative.id)))
        if not existing_narratives:
            for n in NARRATIVES:
                session.add(
                    Narrative(
                        id=n["id"],
                        title=n["title"],
                        category=n["category"],
                        impact=n["impact"],
                        confidence=float(n["confidence"]),
                        summary=n["summary"],
                        evidence=n["evidence"],
                        assets=n["assets"],
                        protocols=n["protocols"],
                        historical_match=n["historical_match"],
                        detected_at=now - timedelta(minutes=n["minutes_ago"]),
                    )
                )
            log.info("seeded_narratives", count=len(NARRATIVES))
