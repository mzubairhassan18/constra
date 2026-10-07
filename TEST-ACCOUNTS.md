# Test Accounts — Constra (LOCAL TESTING ONLY)

> ⚠️ These are throwaway test credentials with known passwords.
> Rotate or delete them under Dashboard → Users before onboarding real users
> or demoing to anyone outside the team. Never reuse these passwords elsewhere.

Live app: `https://constra.mzubairhassan18.workers.dev`
Sign in: `/login` (role tabs pre-select the matching username hint)

| Role | Username | Password | Permissions |
|---|---|---|---|
| Owner (super admin) | `admin` | `S62gWaWg3T_T` | `*` (everything) |
| Accountant | `accountant` | `8mxBKC4u1AZM` | `finance.*`, `bills.*`, `projects.read` |
| Foreman | `foreman` | `rf20Edb73-tN` | `operations.report`, `hr.attendance`, `projects.read` |
| Client | `client` | `QWIUJFLEDtUL` | `portal.read` (portal links only) |

Suggested test tour:

1. **admin** — Dashboard → Users (manage roles), Projects (create villa + stages),
   Finance (trial balance Dr = Cr), Projects → create client portal link.
2. **accountant** — Bills (post a supplier bill, VAT auto), Finance (record receipt
   on an invoice, check VAT position).
3. **foreman** — Operations (daily report + material request), HR (attendance).
4. **client** — open a portal magic link in incognito (no password needed there);
   client login itself is portal-scoped.

Reset a password: Dashboard → Users → Reset, or re-run the seed snippet in
`constra/scripts/seed-admin.mjs` style (bcrypt hash → `users.password_hash`).
