"""SQLAlchemy ORM models: wallet history, AI signals, predictions, protocol metrics."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class WalletProfile(Base):
    __tablename__ = "wallet_profiles"

    address: Mapped[str] = mapped_column(String(42), primary_key=True)
    label: Mapped[Optional[str]] = mapped_column(String(120))
    classification: Mapped[str] = mapped_column(String(20), default="Unknown")  # Elite/Pro/Active/Unknown
    win_rate: Mapped[float] = mapped_column(Float, default=0.0)
    avg_roi: Mapped[float] = mapped_column(Float, default=0.0)
    avg_hold_days: Mapped[float] = mapped_column(Float, default=0.0)
    realized_pnl_usd: Mapped[float] = mapped_column(Float, default=0.0)
    trades_count: Mapped[int] = mapped_column(Integer, default=0)
    score: Mapped[float] = mapped_column(Float, default=0.0, index=True)  # Smart Money Score
    last_updated: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)


class WalletTrade(Base):
    """Single buy/sell/stake/LP event we attribute to a wallet for ROI calc."""

    __tablename__ = "wallet_trades"

    id: Mapped[int] = mapped_column(primary_key=True)
    wallet: Mapped[str] = mapped_column(String(42), ForeignKey("wallet_profiles.address"), index=True)
    asset: Mapped[str] = mapped_column(String(32), index=True)
    side: Mapped[str] = mapped_column(String(10))  # BUY/SELL/STAKE/ADD_LP/REMOVE_LP
    amount: Mapped[float] = mapped_column(Float)
    amount_usd: Mapped[float] = mapped_column(Float)
    tx_hash: Mapped[str] = mapped_column(String(80))
    block_number: Mapped[int] = mapped_column(Integer, index=True)
    occurred_at: Mapped[datetime] = mapped_column(index=True)


class ProtocolMetric(Base):
    __tablename__ = "protocol_metrics"
    __table_args__ = (UniqueConstraint("name", "snapshot_at", name="uq_protocol_snapshot"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), index=True)
    category: Mapped[str] = mapped_column(String(40))
    tvl_usd: Mapped[float] = mapped_column(Float)
    volume_24h_usd: Mapped[float] = mapped_column(Float)
    users_24h: Mapped[int] = mapped_column(Integer)
    fees_24h_usd: Mapped[float] = mapped_column(Float)
    snapshot_at: Mapped[datetime] = mapped_column(default=utcnow, index=True)


class Narrative(Base):
    __tablename__ = "narratives"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)  # e.g. NR-184
    title: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(40), index=True)
    impact: Mapped[str] = mapped_column(String(10))  # Bullish/Bearish/Neutral
    confidence: Mapped[float] = mapped_column(Float)
    summary: Mapped[str] = mapped_column(Text)
    evidence: Mapped[list] = mapped_column(JSON, default=list)
    assets: Mapped[list] = mapped_column(JSON, default=list)
    protocols: Mapped[list] = mapped_column(JSON, default=list)
    historical_match: Mapped[Optional[dict]] = mapped_column(JSON)
    detected_at: Mapped[datetime] = mapped_column(default=utcnow, index=True)

    predictions: Mapped[list["Prediction"]] = relationship(back_populates="narrative")


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True)
    narrative_id: Mapped[Optional[str]] = mapped_column(ForeignKey("narratives.id"))
    asset: Mapped[str] = mapped_column(String(40))
    direction: Mapped[str] = mapped_column(String(10))  # Bullish/Bearish/Neutral
    confidence: Mapped[float] = mapped_column(Float)
    horizon_days: Mapped[int] = mapped_column(Integer)
    rationale: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(default=utcnow, index=True)
    on_chain_id: Mapped[Optional[int]] = mapped_column(Integer)  # contract storage id
    tx_hash: Mapped[Optional[str]] = mapped_column(String(80))

    status: Mapped[str] = mapped_column(String(10), default="Open")  # Open/Won/Lost
    realized_pct: Mapped[Optional[float]] = mapped_column(Float)
    resolved_at: Mapped[Optional[datetime]] = mapped_column()

    narrative: Mapped[Optional[Narrative]] = relationship(back_populates="predictions")


class WhaleMove(Base):
    __tablename__ = "whale_moves"

    id: Mapped[int] = mapped_column(primary_key=True)
    wallet: Mapped[str] = mapped_column(String(42), index=True)
    wallet_label: Mapped[Optional[str]] = mapped_column(String(120))
    move_type: Mapped[str] = mapped_column(String(20))  # INFLOW/OUTFLOW/SWAP/BRIDGE_IN/BRIDGE_OUT/STAKE
    asset: Mapped[str] = mapped_column(String(40))
    amount_usd: Mapped[float] = mapped_column(Float)
    tx_hash: Mapped[str] = mapped_column(String(80))
    block_number: Mapped[int] = mapped_column(Integer, index=True)
    occurred_at: Mapped[datetime] = mapped_column(default=utcnow, index=True)
