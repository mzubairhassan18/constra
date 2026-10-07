# Deploy — Cloudflare Workers (primary) / Vercel (fallback)

## Cloudflare Workers (primary)

The app ships a Workers bundle via OpenNext (`wrangler.jsonc`,
`open-next.config.ts`, `npm run cf:build`). It builds on Windows and on
Linux CI alike (two patches below) — but note that CI is *not* how the
current live worker was published; see the next section.

Live URL: `https://constra.mzubairhassan18.workers.dev`
(account `cfea947a3be727f7334acef2dcb7e7e5`).

### Current deployment: direct from a dev machine (GitHub route NOT used)

The first working deployment was pushed **straight to Cloudflare from a dev
machine**, bypassing the GitHub route entirely — no Workers Builds run and no
GitHub Actions run were involved. Reproduce it with:

```bash
npx wrangler login                # OAuth once; no CLOUDFLARE_API_TOKEN needed
cd constra
npm ci                            # runs postinstall -> scripts/patch-opennext.mjs
npm test                          # must be 107 green (CI runs this before cf:build)
npm run cf:build                  # patch + next build + OpenNext bundle
npx opennextjs-cloudflare deploy -- --keep-vars
```

- Auth is the wrangler OAuth token at
  `%APPDATA%\xdg.config\.wrangler\config\default.toml` — that is why no CI
  secret was required.
- `DATABASE_URL` and `SESSION_SECRET` were set once with
  `npx wrangler secret put <NAME>`; `--keep-vars` keeps them (and the R2
  binding) across deploys.
- The GitHub route **is** still configured (dashboard "Import a repository",
  or `.github/workflows/deploy.yml`) and will work from a push to `main`,
  because the required patch runs *inside* `cf:build` itself rather than
  being a local-only step. It has simply not been exercised yet.

### How the broken deployment was resolved

The worker existed but every page 500'd. Four independent faults were
stacked, each masking the next:

1. **The worker wasn't the app.** `constra` had been created from the
   `dash_template` placeholder with zero secrets. Fix: deploy the real
   OpenNext bundle over it and set `DATABASE_URL` + a fresh 64-hex
   `SESSION_SECRET`.
2. **OpenNext didn't inline `preview-props.json`.** Next 16.4 loads that file
   eagerly from the `NextNodeServer` constructor, but OpenNext's inlining glob
   only matches `{*-manifest,required-server-files,prefetch-hints}.json` —
   every request died with `Unexpected loadManifest(...)`. Fix:
   `scripts/patch-opennext.mjs`. `DEPLOY.md` previously blamed a "Windows-only
   miniflare path bug"; that was wrong, and it is why CI auto-deploy never
   worked either.
3. **`cacheComponents` hangs on workerd.** API routes bypass Next's
   staged-render scheduler, so `/api/health` passed while every *page* hung
   and got cancelled (`Worker's code had hung`). Fix: `cacheComponents: false`
   + drop the 17 `export const instant` exports. See "Required patches".
4. **Skipped migration.** `0008_portal.sql` had never been applied, so
   `portal_tokens` didn't exist and every `/portal/[token]` link 500'd.
   Fix: applied the migration (34 tables).

Verified after each fix with `wrangler tail` (not guesswork): bad requests
stopped producing `Error 1101`, then page renders stopped hanging, then
`/portal/*` returned 404 instead of 500.

Two real product bugs were found along the way and fixed in the same commit:
`last_read_at` used the app clock while `messages.created_at` uses the DB
clock (unread counters never cleared), and ESLint was linting `.open-next/`
build output (42k bogus problems hiding the 10 real ones).

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


### Steps (GitHub route — optional, not how the live worker was deployed)

Use this to hand the pipeline over to CI instead of deploying from a machine:

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

For the GitHub Actions path (`.github/workflows/deploy.yml`) additionally set
repo secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` and
`DATABASE_URL`; the workflow runs `npm test` then `cf:build`, so the chat
clock fix must stay green or CI blocks the deploy.

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
