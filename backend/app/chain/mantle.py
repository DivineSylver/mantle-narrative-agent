"""Mantle RPC client.

Thin async wrapper around web3.py's HTTPProvider. We only need:
- chain head + block fetch
- token transfer event scan
- balance reads
- contract call helpers

For latency reasons everything runs in a threadpool via asyncio.to_thread.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

from tenacity import retry, stop_after_attempt, wait_exponential
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

from app.config import get_settings

ERC20_TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"


@dataclass
class Erc20Transfer:
    token: str
    from_addr: str
    to_addr: str
    value: int
    block_number: int
    tx_hash: str
    log_index: int


class MantleClient:
    def __init__(self, rpc_url: str | None = None) -> None:
        settings = get_settings()
        self._rpc_url = rpc_url or settings.mantle_rpc_url
        self._w3 = Web3(Web3.HTTPProvider(self._rpc_url, request_kwargs={"timeout": 15}))
        # Mantle uses extra fields → inject POA middleware so we don't choke on extraData
        self._w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

    @property
    def w3(self) -> Web3:
        return self._w3

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, max=4))
    async def block_number(self) -> int:
        return await asyncio.to_thread(lambda: self._w3.eth.block_number)

    async def chain_id(self) -> int:
        return await asyncio.to_thread(lambda: self._w3.eth.chain_id)

    async def get_block(self, n: int) -> dict[str, Any]:
        return await asyncio.to_thread(self._w3.eth.get_block, n, True)

    async def erc20_transfers(
        self,
        token_address: str,
        from_block: int,
        to_block: int,
        addresses: list[str] | None = None,
    ) -> list[Erc20Transfer]:
        """Fetch Transfer events for an ERC20 in [from_block, to_block]."""

        token_address = Web3.to_checksum_address(token_address)
        topics: list[Any] = [ERC20_TRANSFER_TOPIC]
        if addresses:
            padded = [Web3.to_hex(Web3.to_bytes(hexstr=Web3.to_checksum_address(a)).rjust(32, b"\x00")) for a in addresses]
            # Match on `to` OR `from` — broad: pass list-of-list as topic-2 (to)
            topics.append(None)  # from = anyone
            topics.append(padded)  # to in addresses

        params = {
            "fromBlock": from_block,
            "toBlock": to_block,
            "address": token_address,
            "topics": topics,
        }
        logs = await asyncio.to_thread(self._w3.eth.get_logs, params)

        out: list[Erc20Transfer] = []
        for log in logs:
            data = log["data"]
            if isinstance(data, bytes):
                value = int.from_bytes(data, "big") if data else 0
            else:
                value = int(data, 16) if data and data != "0x" else 0
            from_addr = "0x" + log["topics"][1].hex()[-40:]
            to_addr = "0x" + log["topics"][2].hex()[-40:]
            out.append(
                Erc20Transfer(
                    token=token_address.lower(),
                    from_addr=Web3.to_checksum_address(from_addr).lower(),
                    to_addr=Web3.to_checksum_address(to_addr).lower(),
                    value=value,
                    block_number=log["blockNumber"],
                    tx_hash=log["transactionHash"].hex(),
                    log_index=log["logIndex"],
                )
            )
        return out

    async def erc20_balance(self, token_address: str, holder: str) -> int:
        token_address = Web3.to_checksum_address(token_address)
        holder = Web3.to_checksum_address(holder)
        abi = [
            {
                "constant": True,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "", "type": "uint256"}],
                "type": "function",
            }
        ]
        contract = self._w3.eth.contract(address=token_address, abi=abi)
        return await asyncio.to_thread(contract.functions.balanceOf(holder).call)


_client: MantleClient | None = None


def get_client() -> MantleClient:
    global _client
    if _client is None:
        _client = MantleClient()
    return _client
