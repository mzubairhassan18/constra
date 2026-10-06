# Improvements: Accounting, UX, AI, Multi-Tenant

## 1. Accounting Refactor (critical — current code is buggy)

Findings from Laravel code:
- `AccountsTrait::determineEntryType + updateAccountBalance` mutates balances inline, no DB transaction guard, deletes don't reverse (`deleteTransactions` just deletes).
- Balances stored as strings/decimals, updated in controllers (Project/HR/Operation) — easy to drift.
- No tax columns: `bills.vat` is a free number, no TRN link, no input/output VAT separation, no fiscal period lock.
- `Account.type/category` are free strings (V1) vs FK (V2) — inconsistent. Auto-created accounts per project/stage/employee with `-Salary-Payable` naming will explode COA.

### 1.1 New COA design (Supabase)

```
companies(id, name, trn, vat_rate default 5, currency AED)
account_types(id, code, name) -- Asset, Liability, Equity, Revenue, Expense
account_categories(id, type_id, code, name) -- e.g. Asset:Cash,Bank,AR,Project-Budget,VAT-In
accounts(id, company_id, code unique per company e.g. 1010-Cash, name, type_id, category_id,
  project_id?, stage_id?, employee_id?, is_system bool, is_postable bool, opening_balance, balance generated/stored, deleted_at)
transactions(id, company_id, date, ref, memo, source_table, source_id, reverses_id?, period_id, created_by)
transaction_lines(id, transaction_id, account_id, debit numeric(14,2), credit numeric(14,2),
  CHECK (debit>=0 AND credit>=0 AND (debit>0)!=(credit>0)))
```

Rules:
- One Postgres function `post_double_entry(...)` — inserts header + balanced lines in one txn, updates cached balances via trigger. All app code calls this. Never direct `accounts.balance` writes.
- Reversal = new transaction with `reverses_id`, never UPDATE/DELETE posted lines. Period-close locks `period_id`.
- Auto-create only 5 account templates per project/stage (Budget-Asset, Cost-Expense, BOQ-Revenue, Payables-Liability, Client-AR); employee accounts only on hire (`Salary-Payable`, `Salary-Expense`); dedupe by `code`, don't create duplicates.
- Statements as SQL views/RPCs, not controller math: `trial_balance(company,from,to)`, `profit_loss(...)`, `balance_sheet(...)`, `vat_report(...)`. UI just renders RPC output → fixes drift between `incomeStatementGet` vs `profitLossStatementGet` which currently compute differently.

### 1.2 VAT / Tax engine (UAE-first, configurable later)

Add to `bills` + lines: `trn_no, vat_rate, vat_in, vat_out, place_of_supply, reverse_charge bool, exempt bool`.
- Rate table `tax_codes(code, rate, type: standard/zero/exempt/reverse)` — default 5%.
- Posting: supplier bill → `Dr Expense + Dr VAT-In (Asset) / Cr Cash-AP`; client invoice → `Dr AR + Cr Revenue + Cr VAT-Out (Liability)`. Net VAT payable = Out − In per period.
- `vat_report` RPC groups by tax_code, outputs FTA-style boxes. Link every bill line to `tax_code_id` now; full filing export later.
- Validation: supplier must have TRN if VAT claimed; block `vat>0` without `supplier_id + invoice_no + date`.

### 1.3 Ledger + Analytics UI (massive UX fix)

Replace `AccountsList + LedgerManagement + 4 scattered statement pages` with:
- `Ledger Explorer`: one table (date, ref, account, debit, credit, running balance), filters by account/project/stage/period, click ref → source bill/manpower/attendance drawer. Server-paginated TanStack Table.
- `Account 360°`: header (code, balance, type), tabs [Activity | Linked docs | Statements impact | Audit]. Every balance number is a link to filtered explorer — this fixes "linking" complaint.
- `Close-the-books` bar: unposted drafts count, unbalanced check (should always be 0), period lock button.
- Analytics: KPI cards (Revenue, Cost, Gross margin, VAT payable, AR/AP aging) + 3 charts (cashflow, BOQ vs actual per stage, cost by category) from same RPCs — no separate math.

## 2. Navigation UX: Shortcuts + Graph

- Command palette (`Cmd+K`): goto project/stage/bill/employee, "post petrol cost", "close stage". Index via Supabase `search_documents` view.
- Global links: every `project_id/stage_id/account_id` rendered as chip-link; breadcrumbs `Company / Project / Stage / Bill`.
- Project graph view: nodes = Project → Stages → (Bills, Manpower, Tasks, BODs), edges = money (`transaction_id`). Use React Flow. Node click → detail drawer. Replaces 70-route sidebar hunt. Keep sidebar but collapse to 6 domains.
- Deep-link notifications: chat/unread, payroll-approval, VAT-due all link to filtered page, not generic list.

## 3. AI Integration Architecture

Goal: "ask DB, get answer + chart". Do NOT let LLM write raw SQL to prod.

```
User prompt → Next.js /api/ai/ask → (a) intent router (LLM) → (b) parameterized RPC allowlist
  → Postgres (RLS as user) → rows → (c) LLM formats answer + Vega-Lite spec → render AnswerCard + Chart + table + sources
```

- Allowlist only: `ai_project_summary, ai_stage_costs, ai_ledger_search, ai_payroll_month, ai_vat_position, ai_ar_ap_aging`. Each takes `company_id (from JWT), filters`. No arbitrary `SELECT *`.
- Guardrails: Supabase RLS enforced (pass user JWT to RPC, `security definer` with `current_setting('request.jwt.claims')` check), row cap 500, read-only role for AI, query log table `ai_queries(prompt, rpc, rows, ms)`.
- Charts: LLM returns `{vegaLite: {...}}` or `{chartType, x, y}` — render with Recharts/ECharts. Example prompts: "BOQ vs actual per stage for Marina project", "VAT payable Q3 as bar", "top 5 cost overruns with links".
- Docs AI: embed `documents/quotations` text into `pgvector`, `/api/ai/docs` retrieval for "find contract clause for retention".
- Start with 1 Edge Function + Vercel AI SDK `streamText` + tool-calling to the 6 RPCs. Cost: log + cache frequent prompts (dashboard summaries hourly).

## 4. Generalization for Other Construction Companies (how far?)

~80% reusable if you multi-tenant now:

| Layer | Generalize | Company-specific (template) |
|---|---|---|
| Schema | `company_id` on every table, RLS, `tax_profiles`, `coa_templates` | opening balances, TRN, fiscal year |
| COA | 1 standard template (5 types, ~40 ledgers) + auto project/stage sub-accounts | custom cost heads per company |
| Workflows | stages/activities/milestones/budget generic; foreman/manpower/transport generic | approval chains, wage divisor (26/9), overtime rules as `payroll_policies` row |
| VAT | `tax_codes` per country (UAE 5%, KSA 15%, zero) | filing format |
| UI | white-label (logo, theme_settings already exists), `en/ar` via next-intl, feature flags (`modules` table from modulesPermissions.json) | custom reports |

Effort: add `companies, memberships, coa_templates, tax_profiles, feature_flags` (5 tables) + backfill `company_id=1` for existing data. New company onboarding = 1 onboarding wizard (details → COA clone → users → opening balances → first project from template). Replicate via seed script, not code fork.

What NOT to generalize yet: payroll statutory rules per emirate/country, FTA e-filing API, multi-currency consolidation — keep as per-company config rows, build when second customer demands it.

## 5. Suggested Execution Order

1. `0002_accounting_v2.sql`: new COA + `post_double_entry` + trial/P&L/BS/VAT RPCs + backfill script from old `accounts/transactions`.
2. Ledger Explorer + Account 360° (proves refactor, unblocks UAT).
3. VAT fields + `vat_report` (linking later = filing export).
4. Cmd+K + project graph (biggest perceived UX win, low risk).
5. AI `/ask` with 3 RPCs (project summary, ledger search, stage costs) → expand to 6.
6. `company_id` + onboarding wizard → second pilot company.
