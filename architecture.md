# Architecture Decisions — Single-Company Rebuild (from scratch)

Reference only: `feature.md`, `improvements.md` (old Laravel findings). New build is clean, single company, no multi-tenant tables.

## 1. Layering (your diagram, enforced)

```
[Frameworks & Drivers] -> [Interface Adapters] -> [Use Cases] -> [Domain]
  Next.js RSC, Supabase,   Presenters, Controllers,  App services,      Entities, value objects,
  R2, Router               ViewModels, DTOs, Zod       orchestration      pure TS, no imports
```

Rules:
- `domain/` — pure TS: `Employee, Assignment, StageCost, Bill, VatLine, ClientInvoice`. No `next/`, no supabase imports. Unit-testable.
- `use-cases/` — one folder per vertical slice (`projects/close-stage`, `hr/assign-labour`, `finance/post-entry`). Takes ports (interfaces), returns `Result<T>`.
- `adapters/` — `supabase-*` implements ports. Swapping DB = new adapter only.
- `app/` — thin: RSC fetches via use-case, passes ViewModel to UI. No SQL in components.

Vertical slice layout (decoupled, add/remove easy):
```
src/modules/<slice>/{domain,use-cases,adapters,ui,tools,schema.ts}
src/modules/finance/{domain/ledger.ts, use-cases/post-entry.ts, adapters/supabase-ledger.ts, ui/LedgerExplorer.tsx}
```

## 2. UI separation + kit abstraction (options)

| Concern | Option A | Option B (chosen) |
|---|---|---|
| Logic vs UI | SQL in components | RSC loads ViewModel, Client components pure props — **B** |
| Kit lock-in | Import MUI/Chakra directly everywhere | `src/ui/primitives/` wraps lib (`Button, Input, Table, Dialog`); modules import only primitives — **B**. Start with shadcn/ui + Tailwind (light, RSC-friendly). Swap = rewrite ~15 primitives, not 200 screens. |
| Forms | ad-hoc `request.field` (old bug) | RHF + Zod `schema.ts` per slice, autofill via server `defaultValues`, inline errors — **B** |

Primitives list (only these touch the lib): Button, Input, NumberInput, DatePicker, Select, Table/DataGrid, Dialog/Drawer, Toast, Chart, FileUpload, Avatar, Tabs.

## 3. Chat — socket options

- A) Custom socket.io server: full control, but extra deploy, auth sync, scaling pain.
- B) **Supabase Realtime (chosen)**: Postgres changes → websocket, presence + broadcast built-in, RLS as user JWT, no extra server. `chats, chat_messages` tables + Realtime channel `chat:{id}`. Works for foreman updates + notifications too. Fallback polling for offline mobile queue. If later self-host: replace `adapters/realtime-supabase.ts` with socket.io adapter behind same `RealtimePort` interface.

## 4. Employee model — permanent vs daily wager (your villa scenario)

```ts
Employee { id, kind: 'permanent'|'daily_wager', monthlySalary?, hourlyRate?, ... }
Assignment { employee_id, project_id, stage_id, task_id?, from, to, allocationPct }
Attendance { assignment_id, date, in, out, breakMin, hours }
```

- Permanent → hourly = `monthly / 26 / 8` (config `payroll_policy` row, single company). Daily wager → direct `hourlyRate` or `dayRate/8`.
- Stage labour cost = `SUM(hours * effectiveRate)` per assignment period. Moving 2 permanents P1→P2 = close Assignment row (to=date), open new row — history preserved, costs split correctly.
- Foreman: `TaskUpdate { stage_id, task_id, status, photos[], delayReason? }`, `ManpowerRequest { stage_id, date, skill, qty }`, `MaterialRequest { ... }` → office approves → creates Bill/Hire. Mobile only does these 5 actions.

## 5. Money flow (100% accuracy target)

- Double-entry only via `post_entry()` RPC. Sources: Bill, ManpowerPaid, Transport, Petrol, SalaryAccrual, ClientInvoice, ClientReceipt, VatSettlement. Each stores `source_table/source_id`.
- Client billing: `ClientInvoice { stage_id, amount, vat_out, status: issued/partial/paid }` + `ClientReceipt { invoice_id, amount, method }`. Underpayment → `balance = invoice - receipts`, AR aging shows pending. Company-funded gap visible as negative stage cashflow (BOQ vs actual vs collected).
- VAT (UAE 5%): `tax_codes(standard 5, zero, exempt, reverse)`. Bill lines carry `tax_code, vat_in`; invoices carry `vat_out`. `vat_report(from,to)` = Out − In on cash or invoice basis (configurable; default invoice basis, FTA standard). Lock periods after filing.
- Material price fluctuation: `materials.avg_rate` + `material_prices(history: supplier, date, rate)`. Booking modes: (a) upfront PO locks rate (`PurchaseOrder + lines.rate_locked`), (b) spot buy uses latest receipt rate. Stage cost uses actual receipt rate, variance vs `avg_rate` shown. No silent repricing of old bills.

## 6. Notifications engine (taxonomy)

Events → `notifications { user_id, type, title, link, read }` via DB trigger + Realtime:
- Foreman: task done, delay filed, photos uploaded, next-day plan, material/manpower request.
- Money: bill due in 3/7 days, client payment overdue, daily-wager payout pending, VAT period due.
- HR: visa/mulkia/insurance/passport expiry 30/7 days, leave request, allotment end.
- System: stage complete → next stage auto-opened, period locked.
Admin controls which types push/email/in-app per role. Digest for client portal (no internal costs).

## 7. Client portal (admin-controlled)

Separate route group `/portal/[token]` — magic-link, read-only ViewModels: progress %, stage timeline, photos, delays/dependencies, invoices + receipts, next payment due. Toggle per project: `portal_enabled, show_costs (default off), show_photos, show_delays`. No internal payroll/supplier rates. Same use-cases, different presenter (redacted DTO).

## 8. Permissions / security / encryption

- RBAC: `roles, role_permissions(module, action)`; check twice — Next.js middleware + `requirePerm()` in use-case, RLS `has_perm(jwt, 'bills.write')`.
- RLS on every table with user JWT; service-role only server-side. Audit `audit_log(table, row, action, by, diff)`.
- Encryption: TLS everywhere, R2 SSE-S3, Supabase pgcrypto for `bank_account, passport_no` columns, Auth passwords via Supabase (never own bcrypt + hint like old code). Signed R2 URLs 15min expiry. Secrets in env, never client.

## 9. AI — gateway abstraction (your 2 RPM endpoints + future keys)

```ts
AiPort { route(intent): ToolCall } // adapters: kilo-gateway.ts, kepler-gateway.ts, openai-compat.ts, selfhosted.ts
```

- `src/modules/ai/{gateway/router.ts, planner.ts, semantic/schema.yaml+metrics.yaml, tools/*.ts, ui-actions/navigation.ts}` per your reference.
- 3 engines: (a) NL→Tool (dues/loans = safe SQL with params, LLM only extracts `{months, status}`), (b) forecast (`survival_forecast` RPC: fixed_cost, pipeline, avg margin), (c) doc QA (pgvector only for policy docs).
- Router returns `{ answer, ui_action: { screen, filters, highlight_ids } }` — chat bubble + redirect with filters applied.
- Settings page: provider dropdown (kilo/kepler/custom key/self-host URL), rate-limit queue (2 RPM → job queue + cache), `ai_query_logs` for audit. LLM never raw SQL.

## 10. Incremental build (vertical slices, demoable each)

1. Foundation: auth, primitives, Company+Policy, Cmd+K shell.
2. Projects→Stages→Tasks graph (React Flow) + foreman mobile updates.
3. HR + Assignments + Attendance + stage labour cost.
4. Procurement (Bills/PO with VAT) + material price history.
5. Money: ClientInvoice/Receipt, Ledger Explorer, P&L/BS/VAT RPCs.
6. Notifications + Client portal.
7. Chat (Realtime) + AI ask with 3 tools (dues, stage costs, survival).

Each slice: `schema → domain → use-case + tests → adapter/RPC → UI → mobile check → demo`.
