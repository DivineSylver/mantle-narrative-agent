# Mantle Narrative Agent: Backend

FastAPI + PostgreSQL + Redis + web3.py + OpenAI.

## Layout

```
backend/
├── app/
│   ├── chain/mantle.py             # Mantle RPC async client (web3.py + POA middleware)
│   ├── db/
│   │   ├── models.py               # SQLAlchemy ORM: WalletProfile, WalletTrade,
│   │   │                           # WhaleMove, ProtocolMetric, Narrative, Prediction
│   │   └── session.py              # Async engine + session_scope()
│   ├── services/
│   │   ├── indexer.py              # Layer 1: ERC20 transfer + whale flow indexer
│   │   ├── pricing.py              # Redis-cached spot pricing (CoinGecko + offline fallback)
│   │   ├── smart_money.py          # Layer 2: FIFO ROI, win-rate, composite score
│   │   ├── narrative.py            # Layer 3 + 4: feature vector → LLM → narrative + prediction
│   │   └── onchain_predictions.py  # Layer 5: write/resolve predictions on Mantle
│   ├── config.py                   # Pydantic settings (.env)
│   └── main.py                     # FastAPI app + REST endpoints
├── contracts/                      # See ../contracts/ for the Solidity source
├── pyproject.toml
└── .env.example
```

## Setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # PowerShell: .venv\Scripts\Activate.ps1
pip install -e .[dev]
cp .env.example .env                                # fill OPENAI_API_KEY, SIGNER_PRIVATE_KEY, etc.
# Run Postgres + Redis (docker-compose at repo root)
uvicorn app.main:app --reload --port 8000
```

## Endpoints

All under `/api/v1`:

| Path                       | Description                                       |
|----------------------------|---------------------------------------------------|
| `GET  /health`             | Liveness + network info                           |
| `GET  /narratives`         | Latest detected narratives                        |
| `GET  /smart-money`        | Top-scoring wallets                               |
| `GET  /whales`             | Recent whale moves                                |
| `GET  /predictions`        | Prediction ledger (on-chain backed)               |
| `GET  /predictions/stats`  | Win-rate + lifetime ROI rollup                    |
| `GET  /protocols`          | Latest protocol metrics                           |

## Background jobs

- `app.services.indexer.run_loop()`: continuous ERC20 transfer scan, writes WhaleMoves
- `app.services.smart_money.rebuild_scores()`: refresh wallet scoring
- `app.services.narrative.detect_and_persist()`: generate one narrative + prediction
- `app.services.onchain_predictions.write_on_chain(p)`: commit a prediction to Mantle

Wire these into an `apscheduler` cron for production; for the demo a single CLI runner is fine.
