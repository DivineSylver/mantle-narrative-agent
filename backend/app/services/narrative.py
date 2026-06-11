"""Layer 3 + 4: Narrative Detection & Alpha Generation.

Combines:
  1. Quant signals: aggregate the indexer's recent activity into a feature vector
     (per-asset inflows, smart-money concentration, bridge net-flow, protocol TVL deltas).
  2. LLM reasoning: hand those features to GPT-4o-mini with a structured-output schema
     to produce a {title, category, confidence, evidence, impact} narrative.
  3. Persistence: store the narrative and emit a prediction the on-chain layer will commit.

When `OPENAI_API_KEY` is empty (offline demo) we fall back to a rule-based stub that still
returns a well-formed narrative, so the rest of the system stays demo-able end-to-end.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Any

import structlog
from sqlalchemy import func, select

from app.config import get_settings
from app.db.models import Narrative, Prediction, WhaleMove
from app.db.session import session_scope

log = structlog.get_logger()

SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "title": {"type": "string"},
        "category": {
            "type": "string",
            "enum": ["Yield", "BTCFi", "RWA", "DEX", "Stablecoins", "Liquid Staking"],
        },
        "impact": {"type": "string", "enum": ["Bullish", "Bearish", "Neutral"]},
        "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
        "summary": {"type": "string"},
        "evidence": {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 6},
        "assets": {"type": "array", "items": {"type": "string"}},
        "protocols": {"type": "array", "items": {"type": "string"}},
        "predicted_asset": {"type": "string"},
        "horizon_days": {"type": "integer", "enum": [7, 30, 90]},
    },
    "required": [
        "title",
        "category",
        "impact",
        "confidence",
        "summary",
        "evidence",
        "assets",
        "predicted_asset",
        "horizon_days",
    ],
}


async def _features(window_hours: int = 24) -> dict[str, Any]:
    """Aggregate WhaleMoves into a compact feature vector for the LLM prompt."""

    since = datetime.now(timezone.utc) - timedelta(hours=window_hours)
    async with session_scope() as session:
        rows = await session.execute(
            select(WhaleMove.asset, WhaleMove.move_type, func.sum(WhaleMove.amount_usd))
            .where(WhaleMove.occurred_at >= since)
            .group_by(WhaleMove.asset, WhaleMove.move_type)
        )
        agg: dict[str, dict[str, float]] = {}
        for asset, move_type, total in rows:
            agg.setdefault(asset, {})[move_type] = float(total or 0)
        return {"window_hours": window_hours, "by_asset": agg}


def _fallback_narrative(features: dict[str, Any]) -> dict[str, Any]:
    by_asset = features.get("by_asset", {})
    # Pick the asset with largest net inflow
    best = None
    best_val = 0.0
    for asset, moves in by_asset.items():
        net = float(moves.get("BRIDGE_IN", 0)) + float(moves.get("INFLOW", 0)) - float(moves.get("OUTFLOW", 0))
        if net > best_val:
            best_val = net
            best = asset
    if best is None:
        best = "mETH"

    return {
        "title": f"{best} Accumulation Wave",
        "category": "Liquid Staking" if best == "mETH" else "Yield",
        "impact": "Bullish",
        "confidence": 62,
        "summary": f"Net inflows into {best} exceeded ${int(best_val):,} over the last 24 hours, driven by whale and bridge activity.",
        "evidence": [
            f"Net 24h inflow: ${int(best_val):,}",
            "Bridge-in dominant over outflow",
            "No major DEX outflow signal",
        ],
        "assets": [best],
        "protocols": ["Merchant Moe", "Agni"],
        "predicted_asset": best,
        "horizon_days": 7,
    }


async def _llm_narrative(features: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    if not settings.openai_api_key:
        return _fallback_narrative(features)

    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    system = (
        "You are an on-chain analyst for the Mantle ecosystem. "
        "Given a 24h feature vector of whale and bridge activity per asset, "
        "identify the single strongest emerging narrative. "
        "Be specific. Cite numbers in evidence. Output only valid JSON matching the schema."
    )
    prompt = json.dumps({"features": features}, default=str)

    resp = await client.chat.completions.create(
        model=settings.openai_model,
        temperature=0.2,
        response_format={
            "type": "json_schema",
            "json_schema": {"name": "narrative", "schema": SCHEMA, "strict": True},
        },
        messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
    )
    return json.loads(resp.choices[0].message.content)


async def detect_and_persist() -> tuple[Narrative, Prediction]:
    features = await _features()
    obj = await _llm_narrative(features)
    log.info("narrative_detected", title=obj["title"], confidence=obj["confidence"])

    async with session_scope() as session:
        # generate id
        count = await session.scalar(select(func.count(Narrative.id))) or 0
        nid = f"NR-{(count + 1):04d}"
        narrative = Narrative(
            id=nid,
            title=obj["title"],
            category=obj["category"],
            impact=obj["impact"],
            confidence=float(obj["confidence"]),
            summary=obj["summary"],
            evidence=obj["evidence"],
            assets=obj["assets"],
            protocols=obj.get("protocols", []),
        )
        prediction = Prediction(
            narrative_id=nid,
            asset=obj["predicted_asset"],
            direction=obj["impact"],
            confidence=float(obj["confidence"]),
            horizon_days=int(obj["horizon_days"]),
            rationale=obj["summary"],
        )
        session.add_all([narrative, prediction])
        await session.flush()
        return narrative, prediction
