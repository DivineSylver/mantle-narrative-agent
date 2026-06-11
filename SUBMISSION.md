# Mantle Narrative Agent: submission

Hackathon track: **Alpha & Data** (Human-Driven Data & Analytics + AI-Driven Trading Strategy)

---

## One-line pitch

A Bloomberg Terminal for Mantle, where every AI prediction is committed on-chain so the track record can't be rewritten.

---

## The problem

Crypto research today is a popularity contest:

- **Narratives form on Twitter, not on-chain.** By the time a thesis trends, the smart money is already out. There's no neutral, evidence-backed feed that says "this is what flows are actually doing right now on Mantle."
- **"Smart-money" wallet lists are vibes.** Most trackers rank by balance or volume. They don't separate winners from lucky early holders, and they have no concept of *realized* PnL or hold discipline.
- **Alpha calls are unaccountable.** Influencers and even analytics platforms publish predictions, then quietly delete the misses and screenshot the wins. There's no permanent, auditable ledger of "what was predicted, when, and how did it actually resolve."
- **All of this hits Mantle harder.** It's a newer L2 with real volume but thinner third-party tooling than Ethereum or Solana. Judges and users alike are looking at flows in raw block explorers instead of a coherent terminal.

The cost is real: capital sits idle, retail follows the wrong wallets, and the ecosystem has no objective way to surface its top analysts.

---

## The solution

An autonomous AI analyst that runs three loops over Mantle and writes the conclusions to the blockchain itself.

1. **Watch the chain.** A scheduled indexer pulls ERC20 transfers, protocol TVL, and price data every few minutes for the assets that matter on Mantle (MNT, mETH, fBTC, USDY, USDC) and the protocols around them (Merchant Moe, Agni, INIT, Mantle LSP, Ondo USDY, Pendle Mantle).
2. **Score the wallets.** Every active wallet gets a composite score from FIFO realized PnL, win rate, average ROI, and hold discipline, then sorted into Elite / Pro / Active tiers. No balance proxies, no follower counts.
3. **Commit the prediction.** When a narrative crystallises (flows + smart-money behaviour + price action align), GPT-4o compresses it into a structured signal: title, category, impact, confidence, evidence, asset, horizon. The backend signs and calls `recordPrediction()` on `PredictionStore.sol` on Mantle. The tx hash *is* the proof. At horizon end, the resolver writes the realised outcome back to the same contract. Win-rate becomes a derived on-chain value, not a marketing number.

If the AI is wrong, the loss is on-chain too. That's the point.

---

## What we built

| Layer | What it does | Where it lives |
|---|---|---|
| **Indexer + scheduler** | Pulls Mantle RPC, DeFiLlama, CoinGecko on a loop; persists snapshots | `backend/app/services/`, `backend/app/scheduler.py` |
| **Smart-money scorer** | FIFO realised-PnL pipeline; produces wallet score 0-100 + Elite/Pro/Active tier | `backend/app/services/` |
| **Narrative engine** | Builds a per-asset feature vector from 24h flows + smart-money behaviour, hands it to GPT-4o with a strict JSON schema, returns structured narratives | `backend/app/services/` |
| **Prediction signer** | Web3.py wallet that signs and submits `recordPrediction()` and `resolvePrediction()` | `backend/app/chain/` |
| **`PredictionStore.sol`** | Append-only ledger. Recorder + resolver roles separated. Status (Open / Won / Lost / Voided) derived from realised vs predicted basis points | `contracts/src/PredictionStore.sol` |
| **REST API** | Public read endpoints: narratives, smart-money, whales, predictions, protocols, ecosystem KPIs, heatmap, prices | `backend/app/main.py` (`/api/v1/*`) |
| **Telegram bot** | `/topnarratives /topwhales /smartmoney /predictions /topprotocols /alerts` | `backend/app/bots/telegram_bot.py` |
| **Dashboard frontend** | Bloomberg-style terminal: narrative feed with 24H/7D filter, whale tracker with move-type filter, smart-money leaderboard with VIEW ALL toggle, predictions page with one-click "Generate AI Signal" that lands a real tx, ecosystem heatmap, protocol leaderboard, typeahead search across everything | `frontend/app/(terminal)/`, `frontend/components/` |
| **Marketing landing** | Dedicated `/` page with hero, three-feature grid, proof section with live contract card, and CTA | `frontend/app/page.tsx` |

---

## What's involved (stack)

**Frontend.** Next.js 16 (App Router, route groups), Tailwind v4, RainbowKit + wagmi v2 + viem for wallet UX, TanStack Query for polling, Recharts for sparklines, lucide-react for icons. JetBrains Mono for numerics + Inter for labels. Custom design system with cyan #00D4AA (gain) and coral #FF4757 (loss).

**Backend.** FastAPI + SQLAlchemy async, SQLite (ephemeral on the deployed instance, on-chain is the canonical store), APScheduler for indexer loops, web3.py for chain reads/writes, OpenAI SDK for narrative synthesis, python-telegram-bot 21.9 for the bot.

**Smart contract.** Solidity 0.8.24 + Hardhat. Optimizer at 200 runs, `viaIR: true`. Verified via Sourcify (exact-match bytecode) and visible on Mantlescan.

**Data sources.** Mantle Sepolia RPC, DeFiLlama (protocol TVL), CoinGecko (prices). All public, no scraped feeds.

**Infra.** Vercel (frontend), Render (backend, free tier), Mantle Sepolia for the live contract. No paid infrastructure. Total recurring cost: $0.

---

## How the on-chain piece works (the differentiator)

```
User clicks "Generate AI Signal" on /predictions
  │
  ▼
POST /api/v1/predictions/generate
  │
  ├─► narrative engine returns latest structured signal
  │
  ├─► PredictionStore.recordPrediction(asset, direction, horizonDays, confidenceBps, narrativeId, ...)
  │     signed by the agent wallet, submitted to Mantle Sepolia
  │
  └─► UI receives tx hash → opens Mantlescan link
```

At horizon end (7 / 30 / 90 days):

```
Scheduler reads realized price move
  │
  ▼
PredictionStore.resolvePrediction(id, realizedBps)
  │
  └─► Status derives on-chain: Won if sign(realizedBps) == sign(predictedDirection), else Lost
```

The contract has **no admin escape hatch on outcomes**. The owner can `voidPrediction()` to flag a bad input, but cannot edit a result or hide a miss.

---

## Live links

| What | Where |
|---|---|
| Frontend | https://mantle-narrative-agent-tuu6.vercel.app |
| Backend API | https://mantle-narrative-api.onrender.com |
| Contract (Mantle Sepolia) | https://sepolia.mantlescan.xyz/address/0xfA6a1B789Ea499eBCCefb08aacB8637a0CB3a677 |
| Repo | https://github.com/DivineSylver/mantle-narrative-agent |
| Demo video | *(paste YouTube unlisted link after recording)* |

---

## Submission checklist

- [x] Deployed on Mantle Network (Sepolia)
- [x] Open-source on GitHub
- [x] Public frontend URL
- [x] Smart contract verified on Mantlescan (Exact Match)
- [x] AI function callable on-chain (`recordPrediction` from backend signer)
- [x] Documentation (README + DEPLOY + DEMO_SCRIPT + this file)
- [ ] Demo video (2+ minutes); script ready at `DEMO_SCRIPT.md`

---

## Short copy snippets (for form fields)

**60-character tagline**
> On-chain intelligence for Mantle, audited by the blockchain.

**One-paragraph description**
> Mantle Narrative Agent is an autonomous AI analyst for the Mantle ecosystem. It watches on-chain flows, scores the wallets actually moving the market, generates structured narratives via GPT-4o, and commits every prediction to a verified smart contract on Mantle Sepolia. Outcomes resolve on-chain too, so the track record is a derived blockchain value, not a marketing number. Built with Next.js, FastAPI, and Solidity, deployed on Vercel + Render + Mantle Sepolia at $0/month.

**Tags / keywords**
> ai, on-chain analytics, smart money, narrative detection, defi intelligence, verifiable predictions, mantle, trading terminal