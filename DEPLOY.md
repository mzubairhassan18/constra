# Deploy — Cloudflare Workers (primary) / Vercel (fallback)

## Cloudflare Workers (primary)

The app ships a Workers bundle via OpenNext (`wrangler.jsonc`,
`open-next.config.ts`, `npm run cf:build`). Builds run on
Cloudflare's Linux CI — the local Windows smoke test hits a
Windows-only path bug in miniflare, ignore it.

### Steps (dashboard)

1. Cloudflare dashboard → Workers & Pages → Create → **Import a
   repository** → select `github.com/mzubairhassan18/constra`.
2. Project name: `constra`. Root directory: `constra/`.
   - Build command: `npm run cf:build`
   - Deploy command: `npx opennextjs-cloudflare deploy -- --keep-vars` (`--keep-vars` keeps dashboard vars/secrets across deploys)
3. Variables (Workers → Settings → Variables + Secrets):
   - `DATABASE_URL` (Neon pooled string) — plain variable.
   - `SESSION_SECRET` (fresh 64-hex, do NOT reuse dev value) — **secret**.
   - Optional R2: `R2_ENDPOINT`, `R2_BUCKET=constra-photos`,
     `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` (key/secret as secrets).
     (Cloudflare dashboard → R2 → Manage API tokens.)
   - Optional AI: `AI_GATEWAY_URL`, `AI_GATEWAY_KEY` (secret), `AI_MODEL`.
4. Deploy. Verify: `https://constra.<account>.workers.dev/api/health`
   → `{ok:true}`, then `/login`.

### Local bundle check (Windows)

`npm run cf:build` must end with `Worker saved in .open-next\worker.js`.
`npx wrangler dev` smoke test is expected to fail on Windows
(`loadManifest(/.next/...)` path bug) — production/Linux is unaffected.

## Vercel (fallback)

Vercel → Add New → Project → Import `mzubairhassan18/constra`,
Root Directory `constra/`, env `DATABASE_URL` + `SESSION_SECRET`
(+ optional R2/AI). Deploy.

## UAT — villa scenario (after deploy)

1. Login as `admin`. Dashboard → Users → create foreman + accountant.
2. Projects → create villa project with stages (Foundation, Structure, …).
3. HR → add 5 permanent staff → assign to stage 1.
4. Operations → log a daily report + material request.
5. Bills → post a supplier bill (VAT auto). Finance → trial balance
   must show Dr == Cr; VAT card shows net payable.
6. Finance → issue client invoice → record partial payment → check due.
7. Projects → complete stage 1 → stage 2 auto-opens; notification bell.
8. Portal: project page → create client link → open in incognito.
9. Ask: "upcoming dues?", "survival forecast?".
