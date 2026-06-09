"""Application settings loaded from .env.

Keep secrets out of source — copy `.env.example` to `.env` and fill in values.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Mantle network
    mantle_network: Literal["mainnet", "sepolia"] = "sepolia"
    mantle_rpc_url: str = "https://rpc.sepolia.mantle.xyz"
    mantle_explorer_api: str = "https://explorer.sepolia.mantle.xyz/api"
    mantle_chain_id: int = 5003

    # Asset registry (addresses on Mantle)
    mnt_address: str = "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000"
    meth_address: str = "0xcDA86A272531e8640cD7F1a92c01839911B90bb0"
    fbtc_address: str = "0xC96dE26018A54D51c097160568752c4E3BD6C364"
    usdy_address: str = "0x5bE26527e817998A7206475496fDE1E68957c5A6"
    usdc_address: str = "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9"

    # Database — default to SQLite (zero infra). Swap to
    # postgresql+asyncpg://... in .env for prod / when Docker is available.
    database_url: str = "sqlite+aiosqlite:///./mantle_intel.db"
    redis_url: str = "redis://localhost:6379/0"

    # AI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Prediction contract
    prediction_contract_address: str = ""
    signer_private_key: str = ""  # for backend → contract writes

    # Telegram
    telegram_bot_token: str = ""
    telegram_admin_chat_id: int = 0

    # Server
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:3017",
            "https://*.vercel.app",
        ]
    )
    cors_origin_regex: str = r"https://.*\.vercel\.app"
    api_prefix: str = "/api/v1"


@lru_cache
def get_settings() -> Settings:
    return Settings()
