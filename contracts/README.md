# PredictionStore: Mantle on-chain prediction ledger

Solidity 0.8.24, Hardhat 2.22, deployed to Mantle Sepolia (testnet) and Mantle mainnet.

## What it does

Records the off-chain AI agent's predictions immutably on Mantle, then resolves each one with the realized move in basis points. This is the hackathon's *On-Chain Verification* layer: verifiable proof that the agent's claims hold up.

## Setup

```bash
cd contracts
npm install
cp .env.example .env   # fill DEPLOYER_PRIVATE_KEY and (optionally) RECORDER/RESOLVER
npm run compile
npm test
```

## Deploy + verify on Mantle Sepolia

```bash
npm run deploy:sepolia
```

The deploy script:

1. Deploys `PredictionStore(recorder, resolver)`.
2. Writes `deployments/mantleSepolia.json` with the address, tx, deployer.
3. Mirrors the ABI into `../backend/contracts/PredictionStore.abi.json` for the Python signer.
4. Waits 30s and runs `hardhat verify` against Mantlescan.

After deploy, set in `backend/.env`:

```
PREDICTION_CONTRACT_ADDRESS=0x...
SIGNER_PRIVATE_KEY=0x...   # corresponds to RECORDER_ADDRESS
```

## Roles

| Role     | Powers                                       |
|----------|----------------------------------------------|
| owner    | rotate recorder/resolver, pause, void        |
| recorder | append predictions                           |
| resolver | resolve predictions with realized bps        |

By default the deployer holds all three; rotate before mainnet.

## Functions

- `recordPrediction(asset, direction, confidenceBps, horizonDays, narrativeId) → id`
- `resolvePrediction(id, realizedBps)`
- `voidPrediction(id)`
- `getPrediction(id) → Prediction`
- `getPredictions(start, count) → Prediction[]`
