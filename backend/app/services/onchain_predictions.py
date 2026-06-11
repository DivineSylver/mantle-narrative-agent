"""Layer 5: on-chain prediction store.

Writes the AI's predictions to the Mantle smart contract and tracks the tx hash + on-chain id
back into the local DB. Reads outcomes from chain when resolving open predictions.
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

import structlog
from eth_account import Account
from web3 import Web3

from app.chain.mantle import get_client
from app.config import get_settings
from app.db.models import Prediction
from app.db.session import session_scope

log = structlog.get_logger()

ABI_PATH = Path(__file__).resolve().parents[2] / "contracts" / "PredictionStore.abi.json"


def _load_abi() -> list[dict[str, Any]]:
    if not ABI_PATH.exists():
        # Minimal inline fallback so the module imports even before contracts build.
        return [
            {
                "type": "function",
                "name": "recordPrediction",
                "stateMutability": "nonpayable",
                "inputs": [
                    {"name": "asset", "type": "string"},
                    {"name": "direction", "type": "uint8"},
                    {"name": "confidence", "type": "uint16"},
                    {"name": "horizonDays", "type": "uint16"},
                    {"name": "narrativeId", "type": "string"},
                ],
                "outputs": [{"name": "id", "type": "uint256"}],
            },
            {
                "type": "function",
                "name": "resolvePrediction",
                "stateMutability": "nonpayable",
                "inputs": [
                    {"name": "id", "type": "uint256"},
                    {"name": "realizedBps", "type": "int32"},
                ],
                "outputs": [],
            },
            {
                "type": "event",
                "name": "PredictionRecorded",
                "inputs": [
                    {"indexed": True, "name": "id", "type": "uint256"},
                    {"indexed": False, "name": "asset", "type": "string"},
                    {"indexed": False, "name": "direction", "type": "uint8"},
                    {"indexed": False, "name": "confidence", "type": "uint16"},
                ],
            },
        ]
    return json.loads(ABI_PATH.read_text())


_DIRECTION_MAP = {"Bearish": 0, "Neutral": 1, "Bullish": 2}


async def write_on_chain(prediction: Prediction) -> tuple[int | None, str | None]:
    settings = get_settings()
    if not settings.prediction_contract_address or not settings.signer_private_key:
        log.warning("prediction_chain_skip", reason="missing contract/signer config")
        return None, None

    w3 = get_client().w3
    abi = _load_abi()
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(settings.prediction_contract_address), abi=abi
    )
    acct = Account.from_key(settings.signer_private_key)

    direction = _DIRECTION_MAP.get(prediction.direction, 1)
    confidence = max(0, min(10_000, int(prediction.confidence * 100)))  # bps

    def _send() -> tuple[int | None, str]:
        nonce = w3.eth.get_transaction_count(acct.address)
        fn = contract.functions.recordPrediction(
            prediction.asset, direction, confidence, prediction.horizon_days, prediction.narrative_id or ""
        )
        # fetch live fees instead of hardcoded gwei (Mantle base fee fluctuates)
        try:
            latest = w3.eth.get_block("latest")
            base_fee = latest.get("baseFeePerGas") or w3.eth.gas_price
        except Exception:
            base_fee = w3.eth.gas_price
        priority_fee = w3.to_wei(1, "gwei")
        max_fee = int(base_fee * 2) + priority_fee
        tx = fn.build_transaction(
            {
                "from": acct.address,
                "nonce": nonce,
                "gas": 250_000,
                "maxFeePerGas": max_fee,
                "maxPriorityFeePerGas": priority_fee,
                "chainId": w3.eth.chain_id,
            }
        )
        signed = acct.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        on_chain_id: int | None = None
        for log_entry in receipt.logs:
            try:
                ev = contract.events.PredictionRecorded().process_log(log_entry)
                on_chain_id = int(ev["args"]["id"])
                break
            except Exception:  # noqa: BLE001
                continue
        return on_chain_id, tx_hash.hex()

    on_chain_id, tx_hash = await asyncio.to_thread(_send)
    async with session_scope() as session:
        existing = await session.get(Prediction, prediction.id)
        if existing is not None:
            existing.on_chain_id = on_chain_id
            existing.tx_hash = tx_hash
    log.info("prediction_chain_written", id=prediction.id, on_chain_id=on_chain_id, tx=tx_hash)
    return on_chain_id, tx_hash


async def write_on_chain_by_id(prediction_id: int) -> tuple[int | None, str | None]:
    """Look up a prediction by id and write it on-chain. Avoids detached-instance issues
    by loading the row in a fresh session and capturing its primitive fields before sending."""

    async with session_scope() as session:
        row = await session.get(Prediction, prediction_id)
        if row is None:
            raise RuntimeError(f"prediction {prediction_id} not found")
        # detach by copying primitives; no lazy loads after this
        snapshot = Prediction(
            id=row.id,
            asset=row.asset,
            direction=row.direction,
            confidence=row.confidence,
            horizon_days=row.horizon_days,
            narrative_id=row.narrative_id,
        )

    return await write_on_chain(snapshot)
