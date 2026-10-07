# Deploy — Cloudflare Workers (primary) / Vercel (fallback)

## Cloudflare Workers (primary)

The app ships a Workers bundle via OpenNext (`wrangler.jsonc`,
`open-next.config.ts`, `npm run cf:build`). Build/deploy runs on Linux CI —
but the bundle also builds and runs on Windows (two patches below).

### Required patches (do not remove)

1. `scripts/patch-opennext.mjs` — run by `postinstall` and `cf:build`.
   OpenNext's manifest-inlining glob omits `.next/server/preview-props.json`,
   which Next 16.4 loads eagerly from the `NextNodeServer` constructor. Without
   the patch every request dies with
   `Unexpected loadManifest(/.next/server/preview-props.json) call!` (Error 1101).
   If an upstream OpenNext release adds `preview-props` to the glob, the script
   exits non-zero telling you to drop it.
2. `cacheComponents` is **off** in `next.config.ts`, and the pages therefore
   have no `export const instant = ...` (Next hard-errors on `instant` without
   the flag). Next's Cache Components staged-render scheduler depends on Node
   timer internals (`_idleStart`, `process.nextTick` ordering) that workerd does
   not implement, so page renders hang and the runtime cancels them
   (`Your Worker's code had hung and would never generate a response`).
   API routes are unaffected, which makes `/api/health` pass while every page
   500s. The fix is opennextjs-cloudflare#1318 (unmerged as of 2026-10-07);
   once it ships in a release, re-enable `cacheComponents` and restore the
   `instant` exports. The app never uses `"use cache"`, so nothing else changes.

### Cache

`open-next.config.ts` uses `r2IncrementalCache`, bound in `wrangler.jsonc` to
the R2 bucket `nextjs-demo-cache` (`NEXT_INC_CACHE_R2_BUCKET`). Without the
binding the override raises an ignorable error and the worker still works.


### Steps (dashboard)

1. Cloudflare dashboard → Workers & Pages → Create → **Import a
   repository** → select `github.com/mzubairhassan18/constra`.
2. Project name: `constra`. Root directory: `constra/`.
   - Build command: `npm run cf:build`
   - Deploy command: `npx opennextjs-cloudflare deploy -- --keep-vars` (`--keep-vars` keeps dashboard vars/secrets across deploys)
3. Variables (Workers → Settings → Variables + Secrets):
   - `DATABASE_URL` (Neon pooled string) — **secret** (read at request time).
   - `SESSION_SECRET` (fresh 64-hex, do NOT reuse dev value) — **secret**.
   - Optional R2: `R2_ENDPOINT`, `R2_BUCKET=constra-photos`,
     `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` (key/secret as secrets).
     (Cloudflare dashboard → R2 → Manage API tokens.)
   - Optional AI: `AI_GATEWAY_URL`, `AI_GATEWAY_KEY` (secret), `AI_MODEL`.
4. Deploy. Verify: `https://constra.<account>.workers.dev/api/health`
   → `{ok:true}`, then `/login`.

### Local bundle check

`npm run cf:build` must end with `Worker saved in .open-next\worker.js`.
`npx wrangler dev` smoke test works on Windows and Linux:
`/api/health`, `/login` and `/` must all return 200.

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
