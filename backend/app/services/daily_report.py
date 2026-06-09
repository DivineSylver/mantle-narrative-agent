"""Daily AI report — pulls the last 24h of intelligence and summarizes it.

The report is meant to be:
  - sent to the admin Telegram chat each morning,
  - cached for serving via the API.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

import structlog
from sqlalchemy import desc, func, select

from app.config import get_settings
from app.db.models import Narrative, Prediction, WhaleMove
from app.db.session import session_scope

log = structlog.get_logger()


async def _last_day_facts() -> dict:
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    async with session_scope() as session:
        narratives = (
            await session.scalars(
                select(Narrative).where(Narrative.detected_at >= since).order_by(desc(Narrative.confidence))
            )
        ).all()
        whales_total = await session.scalar(
            select(func.sum(WhaleMove.amount_usd)).where(WhaleMove.occurred_at >= since)
        ) or 0
        whales_count = await session.scalar(
            select(func.count(WhaleMove.id)).where(WhaleMove.occurred_at >= since)
        ) or 0
        new_preds = (
            await session.scalars(
                select(Prediction).where(Prediction.created_at >= since).order_by(desc(Prediction.created_at))
            )
        ).all()

    return {
        "narratives": [
            {
                "id": n.id,
                "title": n.title,
                "category": n.category,
                "impact": n.impact,
                "confidence": n.confidence,
                "summary": n.summary,
            }
            for n in narratives
        ],
        "whales": {"total_usd": float(whales_total), "count": int(whales_count)},
        "predictions": [
            {
                "id": p.id,
                "asset": p.asset,
                "direction": p.direction,
                "confidence": p.confidence,
                "horizonDays": p.horizon_days,
            }
            for p in new_preds
        ],
    }


def _fallback_report(facts: dict) -> str:
    lines = ["📊 *Mantle Daily Report*", ""]
    if facts["narratives"]:
        lines.append("*Top narratives*")
        for n in facts["narratives"][:3]:
            lines.append(f"• {n['title']} — `{n['category']}` · {int(n['confidence'])}%")
        lines.append("")
    w = facts["whales"]
    lines.append(f"*Whale activity* — {w['count']} moves totaling ${int(w['total_usd']):,}")
    lines.append("")
    if facts["predictions"]:
        lines.append(f"*{len(facts['predictions'])} new predictions* committed on-chain")
    return "\n".join(lines)


async def generate_daily_report() -> str:
    facts = await _last_day_facts()
    settings = get_settings()
    if not settings.openai_api_key:
        return _fallback_report(facts)

    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    system = (
        "You are the daily briefing voice of the Mantle Narrative Agent. "
        "Produce a punchy 200-word brief covering: top narratives, smart-money activity, "
        "protocol growth, new opportunities, market sentiment. Use Telegram MarkdownV1. "
        "No emojis other than 📊 🟢 🔴 ⚪."
    )
    user = json.dumps(facts, default=str)
    resp = await client.chat.completions.create(
        model=settings.openai_model,
        temperature=0.4,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return resp.choices[0].message.content or _fallback_report(facts)
