# Demo video script: Mantle Narrative Agent

Target length: **2:00-2:30**. Read aloud while screen-recording. Format: `[TIME] [ACTION] · "Voiceover"`.

Pre-roll checklist:
- Browser zoom 110% so judges can read text
- Both tabs open: frontend + Mantlescan contract page
- Render backend warmed up (hit `/api/v1/health` once before you start; free tier sleeps after 15 min)
- Deployer wallet has ≥ 0.5 test MNT (https://faucet.sepolia.mantle.xyz)
- Screen recorder set to 1080p, mic close, no background noise

---

## Beat 1: Hook (0:00-0:15)

[0:00] Cursor on the dashboard URL bar, hit enter.
[0:05] Show the landing dashboard. KPIs, narrative ticker, heatmap visible.

> "This is the Mantle Narrative Agent, an autonomous AI analyst for the Mantle ecosystem. Think Bloomberg Terminal, but every signal it generates gets written on-chain, so its track record is verifiable, not vibes."

---

## Beat 2: Dashboard / KPIs (0:15-0:35)

[0:15] Hover over the four KPI tiles (Mantle TVL, DEX TVL, Liquid Staking, RWA TVL).
[0:25] Scroll to the **Ecosystem Heatmap**. Show the category × asset grid lighting up.

> "The agent pulls live on-chain data from DeFiLlama and the Mantle RPC every few minutes. Right now: $156 million in Mantle TVL, with capital rotating into RWA, up 11% in 24 hours. The heatmap shows exactly which assets are absorbing flow."

---

## Beat 3: Narratives (0:35-0:55)

[0:35] Click **Narratives** in the nav.
[0:40] Hover over the top card. Show title, confidence score, supporting evidence.
[0:50] Scroll past 2 more cards.

> "The narrative engine compresses a 24-hour feature vector per asset, feeds it to GPT-4o, and gets back a structured signal: title, category, confidence, and the on-chain evidence that supports it. No hallucinated narratives. Every bullet maps to a real flow."

---

## Beat 4: Smart Money / Whales (0:55-1:15)

[0:55] Click **Wallets** (or Smart Money tab).
[1:00] Show the wallet leaderboard. Elite/Pro/Active tiers, win rates, ROI.
[1:08] Click into one wallet's recent action.

> "Wallets are scored on FIFO realized PnL, hold time, and consistency, not just balance. We surface the top 'Elite' tier with 70%+ win rates so users can shadow what real money is doing, not what Twitter is screaming about."

---

## Beat 5: The on-chain proof (1:15-1:55) ⭐ MONEY SHOT

[1:15] Click **Predictions** in nav.
[1:18] Show the predictions table (may be empty in prod).
[1:22] Click **Generate AI Signal** button. Status: "Pending..."
[1:25] *Wait*. Narrate the architecture while it processes.

> "When I click this, the backend pulls the latest narrative, signs a transaction with the agent's wallet, and calls `recordPrediction` on our smart contract, live on Mantle Sepolia."

[1:38] Success toast appears with Mantlescan link.

> "There it is. Block confirmed."

[1:42] Click the Mantlescan link → opens the transaction.
[1:48] Highlight the `recordPrediction` method call and decoded args (asset, direction, horizon, confidence).

> "This is the proof. The AI's prediction is now permanent on Mantle. Anyone can audit it, and 7 days from now the resolver writes the actual outcome to the same contract. Win-rate becomes a fact, not a marketing number."

---

## Beat 6: Outro (1:55-2:15)

[1:55] Switch to Mantlescan contract page (`/address/0xfA6a...3a677`).
[2:00] Show the green "Source Code Verified" checkmark.
[2:05] Back to frontend home; hover over the search bar; type "merchant" → show typeahead.

> "Contract is verified on Mantlescan, source is open. Search works across protocols, wallets, narratives, and tokens. Repo's in the description: DivineSylver/mantle-narrative-agent. Thanks for watching."

[2:15] Cut.

---

## Common takes you might need to redo

| Symptom | Likely cause | Fix |
|---|---|---|
| `Generate AI Signal` spins forever | Render cold-started | Hit `/api/v1/health` once before recording |
| Tx fails with "insufficient funds" | Deployer wallet drained | Faucet: https://faucet.sepolia.mantle.xyz |
| Wallets/narratives tab empty | Scheduler hasn't run yet on a cold Render boot | Wait 60s after first health hit, refresh |
| KPIs all show "-" | CORS, or backend env vars missing | Check Render env + `CORS_ORIGINS` |
| Mantlescan link 404s | TX still propagating (rare on Mantle Sepolia) | Wait 10s, refresh |

---

## Editing notes (post-record)

- Cut any "loading…" pauses to keep it tight; the actual on-chain wait (~10s) is the only one worth keeping (it's the proof)
- Add a 0.5s text overlay on the Mantlescan tx page: **"Live on Mantle Sepolia • block #XXXXXX"**
- Outro card with three lines: `Frontend: <url>` / `Contract: <addr>` / `GitHub: <repo>` (5s, hold)
- Music: optional, lo-fi at -22 LUFS; voice should peak around -6
- Export 1080p mp4, upload to YouTube as **unlisted**, paste link into the submission form
