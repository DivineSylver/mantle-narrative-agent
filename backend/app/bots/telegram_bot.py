"""Telegram bot: exposes the agent's intelligence via slash commands.

Commands:
  /start            welcome + command list
  /topnarratives    top N current narratives (default 5)
  /topwhales        biggest whale moves in the last 4h
  /topprotocols     leaderboard by TVL
  /smartmoney       top scoring wallets
  /alerts           subscribe / unsubscribe to push alerts
  /predictions      latest on-chain backed predictions

The bot is read-only against the same database the API uses, so it stays in sync
without extra plumbing.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

import structlog
from sqlalchemy import desc, select
from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import Application, CommandHandler, ContextTypes

from app.config import get_settings
from app.db.models import Narrative, Prediction, ProtocolMetric, WalletProfile, WhaleMove
from app.db.session import session_scope

logging.basicConfig(level=logging.INFO)
log = structlog.get_logger()


def _short(addr: str) -> str:
    return f"{addr[:6]}…{addr[-4:]}" if addr else "-"


def _ts(dt: datetime) -> str:
    diff = datetime.now(timezone.utc) - dt
    if diff.total_seconds() < 60:
        return "now"
    if diff < timedelta(hours=1):
        return f"{int(diff.total_seconds() // 60)}m"
    if diff < timedelta(days=1):
        return f"{int(diff.total_seconds() // 3600)}h"
    return f"{diff.days}d"


# ---------- handlers ----------


async def cmd_start(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    msg = (
        "*Mantle Narrative Agent*\n\n"
        "Commands:\n"
        "/topnarratives - emerging narratives\n"
        "/topwhales - whale flows (4h)\n"
        "/topprotocols - protocols by TVL\n"
        "/smartmoney - top wallets\n"
        "/predictions - on-chain predictions\n"
        "/alerts - subscribe to push alerts\n"
    )
    await update.message.reply_text(msg, parse_mode=ParseMode.MARKDOWN)


async def cmd_topnarratives(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    async with session_scope() as session:
        rows = (
            await session.scalars(
                select(Narrative).order_by(desc(Narrative.detected_at)).limit(5)
            )
        ).all()
    if not rows:
        await update.message.reply_text("_No narratives detected yet._", parse_mode=ParseMode.MARKDOWN)
        return
    lines = ["*Top narratives*"]
    for n in rows:
        arrow = "🟢" if n.impact == "Bullish" else ("🔴" if n.impact == "Bearish" else "⚪")
        lines.append(
            f"{arrow} *{n.title}*\n"
            f"   `{n.category}` · conf `{int(n.confidence)}%` · {_ts(n.detected_at)} ago"
        )
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


async def cmd_topwhales(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    since = datetime.now(timezone.utc) - timedelta(hours=4)
    async with session_scope() as session:
        rows = (
            await session.scalars(
                select(WhaleMove)
                .where(WhaleMove.occurred_at >= since)
                .order_by(desc(WhaleMove.amount_usd))
                .limit(10)
            )
        ).all()
    if not rows:
        await update.message.reply_text("_No whale flows in the last 4h._", parse_mode=ParseMode.MARKDOWN)
        return
    lines = ["*Whale moves · 4h*"]
    for w in rows:
        lines.append(
            f"• `{w.move_type}` *{w.asset}* ${int(w.amount_usd):,} · `{_short(w.wallet)}` · {_ts(w.occurred_at)} ago"
        )
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


async def cmd_topprotocols(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    async with session_scope() as session:
        # latest snapshot per protocol
        rows = (
            await session.scalars(
                select(ProtocolMetric).order_by(desc(ProtocolMetric.tvl_usd)).limit(10)
            )
        ).all()
    if not rows:
        await update.message.reply_text("_No protocol metrics indexed yet._", parse_mode=ParseMode.MARKDOWN)
        return
    lines = ["*Top protocols by TVL*"]
    for i, p in enumerate(rows, start=1):
        lines.append(
            f"{i:>2}. *{p.name}* `{p.category}` · TVL ${int(p.tvl_usd):,} · vol ${int(p.volume_24h_usd):,}"
        )
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


async def cmd_smartmoney(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    async with session_scope() as session:
        rows = (
            await session.scalars(
                select(WalletProfile).order_by(desc(WalletProfile.score)).limit(10)
            )
        ).all()
    if not rows:
        await update.message.reply_text("_No wallet scores yet._", parse_mode=ParseMode.MARKDOWN)
        return
    lines = ["*Top smart-money wallets*"]
    for w in rows:
        lines.append(
            f"• `{_short(w.address)}` *{w.classification}* · win {w.win_rate:.0f}% · ROI {w.avg_roi:+.0f}% · PnL ${int(w.realized_pnl_usd):,}"
        )
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


async def cmd_predictions(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    async with session_scope() as session:
        rows = (
            await session.scalars(
                select(Prediction).order_by(desc(Prediction.created_at)).limit(8)
            )
        ).all()
    if not rows:
        await update.message.reply_text("_No predictions yet._", parse_mode=ParseMode.MARKDOWN)
        return
    lines = ["*Latest predictions* (on-chain)"]
    for p in rows:
        emoji = "🟢" if p.direction == "Bullish" else ("🔴" if p.direction == "Bearish" else "⚪")
        line = f"{emoji} #{p.id} *{p.asset}* {p.direction} · {int(p.confidence)}% · {p.horizon_days}d"
        if p.tx_hash:
            line += f"\n   `{p.tx_hash[:10]}…`"
        lines.append(line)
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


async def cmd_alerts(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    # bot_data is shared application state, fine for a demo
    subs: set[int] = ctx.application.bot_data.setdefault("subs", set())
    args = (ctx.args or [None])[0]
    if args == "off":
        subs.discard(chat_id)
        await update.message.reply_text("Unsubscribed.")
    else:
        subs.add(chat_id)
        await update.message.reply_text("Subscribed. You'll receive new narrative alerts.")


# ---------- runner ----------


def build_application() -> Application:
    settings = get_settings()
    if not settings.telegram_bot_token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN not configured")

    app = Application.builder().token(settings.telegram_bot_token).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_start))
    app.add_handler(CommandHandler("topnarratives", cmd_topnarratives))
    app.add_handler(CommandHandler("topwhales", cmd_topwhales))
    app.add_handler(CommandHandler("topprotocols", cmd_topprotocols))
    app.add_handler(CommandHandler("smartmoney", cmd_smartmoney))
    app.add_handler(CommandHandler("predictions", cmd_predictions))
    app.add_handler(CommandHandler("alerts", cmd_alerts))
    return app


async def broadcast_narrative(app: Application, narrative: Narrative) -> None:
    """Push a new narrative to every subscribed chat."""
    subs: set[int] = app.bot_data.get("subs", set())
    if not subs:
        return
    arrow = "🟢" if narrative.impact == "Bullish" else ("🔴" if narrative.impact == "Bearish" else "⚪")
    msg = (
        f"{arrow} *New narrative · {narrative.id}*\n"
        f"*{narrative.title}*\n"
        f"`{narrative.category}` · conf `{int(narrative.confidence)}%`\n"
        f"{narrative.summary}"
    )
    for chat_id in subs:
        try:
            await app.bot.send_message(chat_id, msg, parse_mode=ParseMode.MARKDOWN)
        except Exception as e:  # noqa: BLE001
            log.warning("broadcast_failed", chat=chat_id, err=str(e))


def main() -> None:
    asyncio.run(build_application().run_polling(close_loop=False))


if __name__ == "__main__":
    main()
