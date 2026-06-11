# Mantle Narrative Agent

> Autonomous AI analyst for the Mantle ecosystem. Detects emerging narratives, tracks smart-money, generates verifiable alpha signals, and writes its predictions on-chain for transparent performance validation.

**Track:** Alpha & Data: Human-Driven Data & Analytics (+ AI-Driven Trading Strategy)

## Live demo

| What | Where |
|---|---|
| Frontend | https://mantle-narrative-agent-tuu6.vercel.app |
| Backend API | https://mantle-narrative-api.onrender.com |
| Smart contract | [`0xfA6a1B789Ea499eBCCefb08aacB8637a0CB3a677`](https://sepolia.mantlescan.xyz/address/0xfA6a1B789Ea499eBCCefb08aacB8637a0CB3a677) (Mantle Sepolia, verified) |
| Source | https://github.com/DivineSylver/mantle-narrative-agent |

Try it: open the frontend, go to **Predictions** → click **Generate AI Signal** → wait ~15s → the new prediction lands on Mantle Sepolia with a clickable Mantlescan link.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Layer 1  Data Collection   → Mantle RPC + indexer  (backend/app/services)   │
│  Layer 2  Smart Money       → FIFO ROI + composite score                     │
│  Layer 3  Narrative Engine  → feature vector → GPT-4o → structured JSON      │
│  Layer 4  Alpha Generation  → narrative → prediction with confidence         │
│  Layer 5  On-chain Verify   → PredictionStore.sol on Mantle Sepolia/Mainnet  │
├──────────────────────────────────────────────────────────────────────────────┤
│  Frontend  Next.js 16 + Tailwind v4 + Bloomberg-style trading-terminal UI    │
│  Backend   FastAPI + SQLAlchemy async + Postgres + Redis + APScheduler       │
│  Bot       python-telegram-bot · /topnarratives /topwhales /smartmoney ...   │
│  Contract  Solidity 0.8.24 + Hardhat, verified on Mantlescan                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Repo layout

```
NFT/
├── frontend/      Next.js dashboard: narratives, smart-money, whales, predictions, heatmap, protocols
├── backend/       FastAPI app, Mantle indexer, AI engines, Telegram bot, scheduler
├── contracts/     PredictionStore.sol + Hardhat suite (Mantle Sepolia + mainnet)
├── docker-compose.yml   Postgres + Redis for local dev
└── README.md
```

## Quickstart (local dev)

### 0. Prereqs

- Node 20+, Python 3.11+, Docker
- Wallet funded with Mantle Sepolia ETH

### 1. Infra

```bash
docker compose up -d              # Postgres + Redis
```

### 2. Contract

```bash
cd contracts
npm install
cp .env.example .env              # DEPLOYER_PRIVATE_KEY=...
npm run compile
npm test                          # 10/10 pass
npm run deploy:sepolia            # writes deployments/mantleSepolia.json + verifies
```

This automatically mirrors the ABI into `backend/contracts/PredictionStore.abi.json`.

### 3. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # PS: .venv\Scripts\Activate.ps1
pip install -e .[dev]
cp .env.example .env              # fill PREDICTION_CONTRACT_ADDRESS, SIGNER_PRIVATE_KEY,
                                  # OPENAI_API_KEY, TELEGRAM_BOT_TOKEN
uvicorn app.main:app --reload --port 8000
python -m app.scheduler           # in another shell: indexer + narrative loop + bot
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev                       # http://localhost:3000
```

## Key endpoints

| Endpoint                          | Returns                                  |
|-----------------------------------|------------------------------------------|
| `GET /api/v1/narratives`          | Latest detected narratives + evidence    |
| `GET /api/v1/smart-money`         | Top scoring wallets                      |
| `GET /api/v1/whales`              | Whale moves (≥ $250k flows)              |
| `GET /api/v1/predictions`         | Prediction ledger with on-chain refs     |
| `GET /api/v1/predictions/stats`   | Win-rate, realized PnL rollup            |
| `GET /api/v1/protocols`           | Latest protocol metrics                  |

## Smart contract

`PredictionStore.sol` on Mantle Sepolia (chainId 5003).

| Function                  | Description                                       |
|---------------------------|---------------------------------------------------|
| `recordPrediction(...)`   | Append-only, recorder-gated, returns `id`         |
| `resolvePrediction(id,r)` | Resolver-gated, derives Won/Lost from sign vs dir |
| `voidPrediction(id)`      | Owner-only escape hatch                           |
| `getPrediction(id)`       | Read a single prediction                          |
| `getPredictions(s,n)`     | Paginated read                                    |

Deployed addresses: see `contracts/deployments/`.

## AI workflow

1. **Indexer** scans ERC20 transfers for tracked assets (MNT, mETH, fBTC, USDY, USDC); flags $≥250k moves as `WhaleMove`.
2. **Smart-money scorer** computes FIFO realized PnL → win rate, avg ROI, composite score (0-100) → `Elite/Pro/Active` classification.
3. **Narrative engine** aggregates the last 24h into a feature vector per asset, hands it to GPT-4o with a strict JSON schema, returns `{title, category, impact, confidence, evidence, predicted_asset, horizon_days}`.
4. **Prediction** is persisted off-chain and immediately committed to `PredictionStore` on Mantle. The resulting tx hash is the verifiable proof.
5. **Resolver** (scheduled) reads the realized price move at each horizon (`7d/30d/90d`) and calls `resolvePrediction(id, realizedBps)`. Status (Won/Lost) derives on-chain.

## Mantle ecosystem coverage

- **Assets:** MNT, mETH, fBTC, USDY, USDC
- **Protocols:** Merchant Moe, Agni Finance, Fluxion, Mantle LSP, INIT Capital, Ondo USDY, Pendle Mantle
- **Data sources:** Mantle RPC, Mantle Explorer API, DEX subgraphs

## Submission checklist

- [x] Mantle Network deployment: Sepolia, [`0xfA6a1B789Ea499eBCCefb08aacB8637a0CB3a677`](https://sepolia.mantlescan.xyz/address/0xfA6a1B789Ea499eBCCefb08aacB8637a0CB3a677)
- [x] Open-source GitHub repo: https://github.com/DivineSylver/mantle-narrative-agent
- [x] Public frontend URL: https://mantle-narrative-agent-tuu6.vercel.app
- [ ] Demo video (2+ min)
- [x] Verified smart contract (Mantlescan, Exact Match via Sourcify)
- [x] AI function callable on-chain (`recordPrediction` from backend signer)
- [x] Documentation (this file + per-component READMEs + `DEPLOY.md`)

## Design system

UI tokens lifted from [`nexu-io/open-design`](https://github.com/nexu-io/open-design) → `design-systems/trading-terminal`. Bloomberg-inspired, dark-only, JetBrains Mono for numerics, Inter for labels, sharp corners, flat surfaces, cyan #00D4AA = bullish / coral #FF4757 = bearish.
