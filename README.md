# Constra — Construction Site Management

Single-company construction ERP: projects + stages, HR (permanent & daily-wage labour),
procurement with UAE VAT, double-entry ledger, site operations, team chat,
notifications, client portal, and an AI assistant. Rebuilt from a Laravel
reference app — full use-case map in `feature.md`.

## Stack

- **Next.js 16** (App Router, Server Components, `src/` dir) + Tailwind
- **Neon Postgres** (Singapore) via `@neondatabase/serverless` HTTP driver —
  works on Node, Vercel, and Cloudflare Workers
- **Cloudflare R2** (`constra-photos` bucket) for site photos via S3 API
- **Cloudflare Workers** hosting via OpenNext adapter (`npm run cf:build`)
- **Vitest** — unit (fake ports) + Neon integration tests, run on every change

## Layout

```
constra/src/
  app/(dashboard)/{projects,hr,bills,finance,masters,operations,chat,ask,fleet,users,notifications}/
  app/portal/[token]/      # public client portal (token links, redacted DTOs)
  app/api/{health,chat,photos,ai/ask,debug}/
  modules/<slice>/{domain,use-cases,adapters,schema}.ts  # vertical slices
  lib/{db,r2,session,ai-gateway}.ts
constra/src/proxy.node.ts  # auth gate (disabled: experimental Node proxy crashes workerd; pages self-guard)
db/migrations/0001_*.sql  # foundation → fleet; applied in order
```

Layering: `domain/` (pure TS) → `use-cases/` (ports) → `adapters/` (Neon SQL).
No SQL in components; auth re-checked inside every server action.

## Quickstart

```bash
cd constra
cp .env.example .env.local   # fill DATABASE_URL, SESSION_SECRET
npm install
npm test                     # 107 green (needs DATABASE_URL)
npm run dev                  # http://localhost:3000  (admin login below)
```

Seed an admin: `node scripts/seed-admin.mjs` prints a password+hash,
then insert into `users` with the `super_admin` role id.

## Deploy

Pushes to `main` auto-deploy via Workers Builds trigger
(`npm run cf:build` + `opennextjs-cloudflare deploy -- --keep-vars`).
Alternative: GitHub Actions (`.github/workflows/deploy.yml`) needs
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DATABASE_URL` repo secrets.
Dashboard still owns runtime vars/secrets (`DATABASE_URL`, `SESSION_SECRET`,
optional R2 + AI keys). Details + UAT script: `DEPLOY.md`.

## Docs

- `feature.md` — all 103 reference use cases
- `architecture.md` — layering, auth, AI, schema decisions
- `improvements.md` — accounting/VAT refactor notes
- `DEPLOY.md` — hosting + villa-scenario UAT
