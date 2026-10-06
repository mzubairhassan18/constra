# Deploy — Vercel (recommended)

Vercel is the zero-config host for this Next.js 16 app
(dynamic routes, server actions, proxy gate, Node runtime).

## Steps (dashboard, ~5 min)

1. vercel.com → Add New → Project → Import
   `github.com/mzubairhassan18/constra`.
2. Root Directory: `constra`. Framework: Next.js (auto).
3. Environment Variables (Production + Preview):
   - `DATABASE_URL` — Neon pooled connection string
     (Neon console → constra → Connect → pooled).
   - `SESSION_SECRET` — fresh random 64-hex (do NOT reuse dev value):
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Optional R2: `R2_ENDPOINT`, `R2_BUCKET=constra-photos`,
     `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
     (Cloudflare dashboard → R2 → Manage API tokens).
   - Optional AI: `AI_GATEWAY_URL`, `AI_GATEWAY_KEY`, `AI_MODEL`.
4. Deploy. Verify: `/api/health` → `{ok:true, tables:…}`,
   then login at `/login`.

## Why not Cloudflare Workers (yet)

Workers need the OpenNext adapter + R2 bindings + compat checks
for `bcryptjs`/`jose`/Neon-HTTP. Possible later; Vercel works now
with no code changes. The Neon-HTTP driver and R2-S3 client were
chosen to keep the Workers option open.

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
