"""Scheduler: wires the agent's recurring jobs.

Run with:  python -m app.scheduler

Jobs:
  - indexer.run_loop()           continuous (its own loop)
  - rebuild_scores()             every 15 min
  - detect_and_persist()         every 30 min, generates new narrative+prediction
  - write_on_chain(latest)       fires when a new prediction lands
  - generate_daily_report()      08:00 UTC daily, broadcast to Telegram admin chat
"""

from __future__ import annotations

import asyncio

import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import desc, select
from telegram.constants import ParseMode

from app.config import get_settings
from app.db.models import Prediction
from app.db.session import init_db, session_scope
from app.services.daily_report import generate_daily_report
from app.services.indexer import run_loop as indexer_loop
from app.services.narrative import detect_and_persist
from app.services.onchain_predictions import write_on_chain
from app.services.smart_money import rebuild_scores

log = structlog.get_logger()


async def _detect_and_chain() -> None:
    _, prediction = await detect_and_persist()
    # Reload to get its PK after commit
    async with session_scope() as session:
        latest = await session.scalar(
            select(Prediction).where(Prediction.narrative_id == prediction.narrative_id)
            .order_by(desc(Prediction.created_at)).limit(1)
        )
    if latest:
        await write_on_chain(latest)


async def _send_daily_report(tg_app=None) -> None:
    body = await generate_daily_report()
    settings = get_settings()
    if tg_app is None or not settings.telegram_admin_chat_id:
        log.info("daily_report_generated", chars=len(body))
        return
    await tg_app.bot.send_message(
        settings.telegram_admin_chat_id, body, parse_mode=ParseMode.MARKDOWN
    )


async def main() -> None:
    await init_db()
    settings = get_settings()

    tg_app = None
    if settings.telegram_bot_token:
        from app.bots.telegram_bot import build_application

        tg_app = build_application()
        await tg_app.initialize()
        await tg_app.start()
        asyncio.create_task(tg_app.updater.start_polling())

    scheduler = AsyncIOScheduler()
    scheduler.add_job(rebuild_scores, IntervalTrigger(minutes=15), id="rebuild_scores")
    scheduler.add_job(_detect_and_chain, IntervalTrigger(minutes=30), id="narrative")
    scheduler.add_job(
        lambda: _send_daily_report(tg_app),
        CronTrigger(hour=8, minute=0, timezone="UTC"),
        id="daily_report",
    )
    scheduler.start()
    log.info("scheduler_started")

    # Indexer runs forever in this task
    await indexer_loop()


if __name__ == "__main__":
    asyncio.run(main())
