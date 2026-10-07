# Test Accounts + Demo Data — Constra (LOCAL TESTING ONLY)

> ⚠️ Throwaway credentials with known passwords. Rotate/delete under
> Dashboard → Users before real use. Never reuse these passwords elsewhere.
>
> ⚠️ Sessions embed permissions at login — **sign out and sign back in**
> after any role/permission change.

Live app: `https://constra.mzubairhassan18.workers.dev` · Sign in: `/login`
(role tabs pre-fill the username). Each role lands on its own home.

## Logins (12)

| Role | Username | Password | Lands on | Sees |
|---|---|---|---|---|
| Super Admin (IT, all `*`) | `superadmin` | `SJGhBnof` | `/dashboard` | everything incl. Users |
| Super Admin (legacy) | `admin` | `S62gWaWg3T_T` | `/dashboard` | everything |
| Owner (read-only overview) | `owner` | `DJtnaVtJ` | `/dashboard` | projects/bills/finance/operations read, chat — **no HR, no Users** |
| Accountant | `accountant` | `8mxBKC4u1AZM` | `/finance` | finance, bills, masters, projects read |
| Foreman | `foreman` | `rf20Edb73-tN` | `/operations` | My work + attendance, reports, requests, manpower |
| HR officer | `hr` | `EiCRfOU_3fTN` | `/hr` | employees, assignments, attendance |
| Client (unlinked spare) | `client` | `QWIUJFLEDtUL` | `/client` | empty state until linked |
| Client — Marina villa | `client.ahmed` | `Uz9fiI2h` | `/client` | Ahmed Al Farsi's workspace |
| Client — JVC | `client.sara` | `i_F1JA6r` | `/client` | Sara Khan's workspace |
| Client — Barsha | `client.omar` | `SkA4Su04` | `/client` | Omar Haddad's workspace |
| Client (unlinked) | `client.layla` | `JPKchD5Z` | `/client` | empty state (link-flow test) |
| Client (unlinked) | `client.yusuf` | `aIotozm5` | `/client` | empty state (link-flow test) |

Role model: **owner ≠ admin**. `super_admin` = IT god-mode. `owner` = company
overview, read-only. `admin` role exists for office managers (kept, unused).

## Demo data (`constra/scripts/seed-demo.mjs` — re-runnable)

- **3 projects**: Marina Gate Villa (Ahmed, Palm Jumeirah, AED 2.4M, 25% —
  Foundation done, Structure in progress, MEP blocked by supplier strike),
  JVC Townhouses Block B (Sara, AED 3.8M, 50%), Al Barsha Office Fit-out
  (Omar, AED 950K, 33%). Each with BOQ/budget per stage + tasks.
- **10 employees**: Khalid (foreman, linked to `foreman` login), Mariam (HR,
  linked to `hr` login), 4 permanent + 4 daily-wage; 9 open assignments,
  12 attendance rows.
- **Money (ledger balanced, Dr = Cr = AED 1,962,288)**: 3 supplier bills with
  5% VAT (+1 exempt line), 2 client invoices (INV-2026-001 part-paid AED 250K
  of 420K → AED 170K due; INV-2026-002 paid in full), 2 manpower crews
  (one with AED 1,000 due).
- **Site ops**: 2 material requests (1 pending, 1 approved), 4 daily reports
  (1 with rain delay), 8 tasks (1 blocked), 3 client messages, 1 portal token
  (`demo-portal-marina-001`), 2 quotations, 2 vehicles (+service +1 fine),
  3 suppliers (with TRNs), 5 materials.

## Test tour

1. **owner** — dashboard company picture (no HR menu ✓), open Marina project.
2. **superadmin** — Users: link `client.layla` to Barsha project → her workspace fills.
3. **accountant** — Bills → 🖨 print DEMO-B1; Finance → record receipt on
   INV-2026-001 → notifications fire.
4. **foreman** — Operations → My work shows Khalid's Structure posting; log
   attendance; file report with photo; request cement → approve as superadmin
   → foreman gets “request decided”.
5. **hr** — assign Deepak to JVC, log hours, open employee 360° pages.
6. **client.ahmed** — progress 25%, AED 170K due, updates, photos, message thread
   (already contains Q+A); send a message → admins notified at /client.

Reset a password: Users → Reset (super_admin), or bcrypt into `users.password_hash`.
Re-seed after destructive testing: `node scripts/seed-demo.mjs` (wipes + rebuilds demo only).
`npm test` is demo-safe: all suites clean only `__test`-scoped rows.
