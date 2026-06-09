# Deploying Mantle Narrative Agent to a public URL

Total time: **~20 minutes**. Cost: **$0** (Vercel + Render free tiers).

Result:
- Frontend: `https://mantle-narrative.vercel.app` (or whatever Vercel names it)
- Backend:  `https://mantle-narrative-api.onrender.com`
- Contract: already live on Mantle Sepolia (`0xfA6a1B789Ea499eBCCefb08aacB8637a0CB3a677`)

---

## Prerequisites (one-time)

- A **GitHub** account
- A **Vercel** account — sign in with GitHub at https://vercel.com
- A **Render** account — sign in with GitHub at https://render.com

Nothing to install locally if you push code via GitHub's web UI.

---

## Step 1 — push the code to GitHub

From the project root (`NFT/`):

```bash
git init
git add .
git commit -m "Initial Mantle Narrative Agent submission"

# create the repo on github.com (public is fine — no secrets are committed)
git remote add origin https://github.com/<YOUR_USERNAME>/mantle-narrative-agent.git
git branch -M main
git push -u origin main
```

`.env` files and `node_modules/` are already in `.gitignore` — your deployer private key will NOT be pushed.

---

## Step 2 — deploy the backend on Render

1. Go to https://dashboard.render.com → **New +** → **Blueprint**
2. Pick your `mantle-narrative-agent` repo
3. Render auto-detects `render.yaml` and shows the plan: 1 web service + 1 disk (free tier)
4. It will ask for two secret env vars to fill in (they have `sync: false` in the blueprint):
   - `SIGNER_PRIVATE_KEY` → paste the deployer key from `contracts/.env`
     (the `0x0b51c…61b4` one)
   - `OPENAI_API_KEY` → optional. Leave blank for now; the dashboard still works.
5. Click **Apply**
6. Wait ~3 minutes for the first build
7. Note the URL (looks like `https://mantle-narrative-api.onrender.com`)
8. Verify: open `https://<your-backend>.onrender.com/api/v1/health` — should return `{"ok":true,"network":"sepolia"}`

**Heads up:** Render free tier sleeps after 15 min of no traffic, then takes ~30s to wake up on the first request. Fine for a demo, mildly annoying for cold judges. Upgrading to Starter ($7/mo) removes the sleep.

---

## Step 3 — deploy the frontend on Vercel

1. Go to https://vercel.com/new
2. Import your `mantle-narrative-agent` repo
3. **Root Directory:** `frontend`
4. Framework: Next.js (auto-detected)
5. Under **Environment Variables**, add:
   - `BACKEND_URL` = `https://<your-backend>.onrender.com` (from step 2)
6. Click **Deploy**
7. Wait ~2 minutes
8. You'll get a URL like `https://mantle-narrative-agent.vercel.app`

---

## Step 4 — wire CORS

Open your Render service → **Environment** → add:

- `CORS_ORIGINS` = `["https://<your-vercel-url>.vercel.app","http://localhost:3000"]`

Render restarts automatically (~1 min). The frontend is now allowed to call the backend.

---

## Step 5 — smoke-test the live demo

1. Open `https://<your-vercel-url>.vercel.app`
2. Check the **Protocols** tab — should show live DeFiLlama data for Mantle protocols
3. Check the **Predictions** tab — should show the on-chain predictions already recorded
4. Click **Generate AI Signal** — wait ~15s — a new prediction lands on Mantle Sepolia, success banner shows the Mantlescan link
5. Try the search bar — type `merchant` or `0x9a4f`

Done. Your hackathon submission URL is the Vercel one.

---

## Common gotchas

| Symptom | Fix |
|---|---|
| Backend cold-start on Render free tier (~30s) | Upgrade to Starter ($7/mo) or use UptimeRobot to ping `/health` every 10 min |
| `Generate AI Signal` returns 500 in prod | Check `SIGNER_PRIVATE_KEY` is set in Render env vars; faucet the deployer if it ran out of test MNT |
| Vercel build fails on `next-env.d.ts` | Already in `.gitignore` — should not happen, but `git rm --cached frontend/next-env.d.ts` if it does |
| Search bar empty | Hard-refresh (Ctrl+Shift+R) — Turbopack/CDN cache from the earlier broken version |
| CORS error in browser console | Step 4 — make sure your Vercel URL is in `CORS_ORIGINS` on Render |

---

## Custom domain (optional, later)

Both Vercel and Render accept custom domains in their dashboards:
- Vercel: Project → Settings → Domains → Add (Vercel handles SSL automatically)
- Render: Service → Settings → Custom Domain

Point an A or CNAME record at the platform-provided host. Domain costs ~$10/year at any registrar (Namecheap, Cloudflare, Porkbun).
