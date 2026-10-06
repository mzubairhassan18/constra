# Implementation Suggestions — Next.js + Supabase + Cloudflare R2

Companion to `feature.md` (UC-01 to UC-103 extracted from Laravel app).

## 1. Recommended Stack (locked)

- **Next.js 15+ App Router** (TypeScript strict): `app/(auth)`, `app/(dashboard)/...`, Server Components by default, Client Components only for grids/forms/chat.
- **Supabase**: Postgres + Auth + Realtime + Edge Functions. RLS on every table. RPCs for accounting/payroll.
- **Cloudflare R2**: buckets `constra-images`, `constra-docs`, `constra-chat`. No Supabase Storage (keep all files in R2 for cost + CDN). Presigned PUT/GET via Next.js Route Handler + `aws-sdk v3 (S3-compatible)`.
- **UI**: Tailwind + shadcn/ui + TanStack Table v8 + TanStack Query v5 + Zustand (replace 39 Redux slices gradually). RHF + Zod for forms. Recharts for finance, `gantt-task-react` successor for stages. `next-intl` (en/ar).
- **Auth**: Supabase Auth (email + username alias). `middleware.ts` guards `(dashboard)` routes. `super_admin` bypass + `roles.permissions JSONB` checked in RLS + server-side helper `requirePermission()`.

## 2. Repo Structure

```
app/(auth)/login/page.tsx
app/(dashboard)/{dashboard,projects,bills,hr,operations,fleet,masters,finance,chat,todo,marketing,quotations}/...
app/api/{auth,uploads,reports}/route.ts
lib/{supabase/{client,server,admin},r2,permissions,ledger}.ts
supabase/{migrations,seed.sql,functions(post_ledger,recalc_payroll)}
components/{ui,grids,forms,uploads}
```

- One route group per `feature.md` §1–6. Mirror Laravel URLs as Next.js paths (e.g. `/projects/details/:id` → `/projects/[id]`) to ease UAT.
- Server Actions for CRUD (`createBill`, `postTransaction`), Route Handlers only for uploads/webhooks/realtime auth.

## 3. Data Migration Principles (from §7 of feature.md)

1. **Clean-slate schema**: fix typos (`vehicals→vehicles`, `sapplier→supplier`, `qutation→quotation`, `forman→foreman`), add `company_id, created_by, updated_by, deleted_at` to all business tables. Single canonical migration set — drop the 3 duplicate Laravel generations.
2. **Link tables properly**: `accounts.project_id/stage_id/employee_id/subcontractor_id/vehicle_id` → real FKs. Fix `DailyTransportImages.dailyTransport()` self-ref, `Tickets→Employees` (not User), `PaymentPlans→SubcontractorTasks`.
3. **Accounting as immutable ledger**: `transactions` (header) + `transaction_details` (2+ lines, `CHECK entry_type IN ('debit','credit')`, balanced trigger). Never UPDATE — reverse with new entry (`reverses_transaction_id`). All Laravel `AccountsTrait` post/reverse logic becomes one Postgres function `post_double_entry(from,to,amount,meta)`.
4. **Files as rows, not strings**: `*_images/documents` tables hold `r2_key, mime, size`; R2 object key = `{table}/{id}/{uuid}-{filename}`. Delete row → delete R2 object via Edge Function/queue.
5. **Seed first**: `account_types/categories, skills, roles/permissions (from modulesPermissions.json), demo company`.

## 4. Build Order (MVP-first, each slice shippable)

**Phase 0 — Foundation (1 wk)**: Supabase project + migrations + RLS + R2 buckets/CORS + Next.js auth/middleware/theme/sidebar/header (UC-01,05–15). Import users/employees.

**Phase 1 — Projects + Stages (1–2 wks)**: UC-30–47. Project create with nested stages/activities via single Server Action + `post_double_entry` for budget. Gantt + StageDetails + markComplete RPC.

**Phase 2 — Bills + Site Costs (1 wk)**: UC-48–53. Bill form (line items + images + credits) → `post_double_entry` + VAT. PettyCash approval flow. Printable invoice (server PDF).

**Phase 3 — HR + Payroll (1–2 wks)**: UC-54–75. Employee CRUD + R2 photo, attendance timeIn/Out (PWA-friendly), `get_payroll_month(company,month)` RPC (replaces `/26/9*hours` logic), bonus/deduction + salary close.

**Phase 4 — Operations (1–2 wks)**: UC-76–86. Manpower/transport/rental + issuance/return (`rate*days` RPC) + foreman reporting (multi-image upload queue + nextDayPlan auto-create).

**Phase 5 — Masters + Quotations + Fleet (1 wk)**: UC-88–97. Simple CRUD pages generated from one `CrudPage<T>` template + Zod schemas.

**Phase 6 — Finance + Reports (1 wk)**: UC-98–103. Accounts/Ledger UI, `income_statement/profit_loss/balance_sheet` RPCs, payables/receivables views, payroll export.

**Phase 7 — Chat + Todo + Marketing + Polish**: UC-19–29. Supabase Realtime chat (replace polling), header unread badge, i18n, PWA offline queue for foreman photos, audit log.

## 5. Key Technical Decisions

- **RLS pattern**: `company_id = auth.jwt()->>'company_id'` on all rows; `is_super_admin()` bypass; per-module check via `has_permission('projects.write')`. Service-role client only in Server Actions/Edge Functions.
- **Upload flow**: Client → `POST /api/uploads/presign {bucket,contentType}` → PUT to R2 → `saveAttachment` Server Action writes row. 10MB limit, image transform via CF Polish/Workers.
- **Realtime**: `chat_messages`, `foreman_reportings`, `transactions` channels; optimistic UI + `revalidatePath`.
- **Validation**: Zod schemas colocated with each form (replaces missing Laravel FormRequests). Shared `Money`, `ImageList`, `DateRange` schemas.
- **State**: Zustand stores per domain (`useProjectStore`, `useChatStore`) — migrate the 39 Redux slices 1:1 initially, then collapse.
- **Testing**: Vitest (RPC/unit) + Playwright (per UC: create project → stage → bill → payroll → P&L balances). Seed + teardown per run.

## 6. What NOT to Port As-Is

- Don't port `GenericList-ag/glide/handsontable/devextreme` sprawl — standardize on TanStack Table + one `DataGrid` wrapper.
- Don't port commented-out `FinanceController@store`, `$$request->id` bug in YearlyCertificate, swapped `getAllHiring/getByIdHiring` names — fix in new code.
- Don't port legacy `react@15` CDN tags in `welcome.blade.php`, empty `app.css`, 21 overlapping CSS files — single Tailwind theme + CSS vars (`theme_settings` → user preference row).

## 7. Immediate Next Steps

1. `npx create-next-app@latest` + `supabase init` + R2 buckets in this repo.
2. Write `supabase/migrations/0001_core.sql` (companies, users profile, roles, employees, projects, stages) from `feature.md` §7.
3. Implement Auth + Sidebar/permission gate + R2 presign — demo vertical slice: Login → Dashboard counts RPC → Add Project with one image.
4. Import MySQL dump via script (`company_id=1`) and UAT against UC checklist in `feature.md` §9.
