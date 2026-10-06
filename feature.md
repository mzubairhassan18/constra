# Construction Industry Automation — Feature / Use-Case Extraction

Source: `D:\D\Downloads-folder-C\SoftwareLaravelApplication\SoftwareLaravelApplication`
Existing stack: Laravel 10 (PHP 8.1) + Sanctum + MySQL + React 18 SPA (Vite 4, Redux Toolkit, Tailwind, MUI/Chakra, AG-Grid, Charts/Gantt) mounted in `resources/views/welcome.blade.php`.
Target stack: Next.js (latest) + Supabase (Postgres + Auth + RLS) + Cloudflare R2 (storage) + enhancements.

---

## 1. Global / Cross-Cutting

### 1.1 Authentication & Session
- UC-01 Login with username + password (`POST /api/login`), issue Sanctum token, reject inactive users.
- UC-02 Signup screen exists in React (`/signup`) — backend stub only.
- UC-03 Cross-tab auth sync, private-route guard, SPA fallback (`GET /{any}` → welcome view).
- UC-04 Logout (token discard client-side).
- UC-05 Get current user (`GET /api/user`).

### 1.2 Users, Roles & Permissions
- UC-06 List all users with employee + role (`GET /users/get`).
- UC-07 Create role + assign to users (`POST /users/create/roles` — `role_name`, `permissions JSON`, `assignees[]`).
- UC-08 Update role + re-assign users (`POST /users/update/roles`).
- UC-09 List all roles (`GET /roles/getAll`), delete role (`GET /roles/delete/{id}`).
- UC-10 Reset user password (bcrypt + plaintext hint) (`POST /reset/password`).
- UC-11 Activate / deactivate user with active/inactive dates (`POST /user/isActive`).
- UC-12 Upload cover image / profile image (`POST /user/cover/image`, `POST /user/profile/image` → `storage/app/public/images/`).
- UC-13 Save theme settings per user (font + Theme JSON) (`POST /theme/setting/save`), persisted in localStorage + DB.
- UC-14 Permission matrix defined in `resources/js/config/modulesPermissions.json` (10 modules); Sidebar gated by `hasRequiredPermissions`, `super_admin` bypass.
- UC-15 Profile page (`/profile`) view/edit own profile.

### 1.3 Dashboard
- UC-16 View dashboard counts (`GET /dashboard/details`): active projects, completed projects, quotations, employees, vehicles, materials, subcontractors.
- UC-17 Dashboard UI cards (`DashboardBox`) + carousel images + quick links.

### 1.4 Common Lookups
- UC-18 Dropdown/autocomplete: all project names + stages, employee names, supplier names, material names, rental shops (distinct), bill tags (flattened unique) (`GET /projects/names/get/all`, `/employee/names/get/all`, `/suppliers/names/get/all`, `/materials/names/get/all`, `/rental/shops`, `/tags/get/all`).

### 1.5 Todo / Personal Productivity
- UC-19 Add todo (`POST /todo/add`: description, due_date, priority, remind_date, color, repeat).
- UC-20 List todos (`GET /todo/get/all`), mark complete (`POST /todo/markAsCompelete`), delete (`GET /todo/delete/{id}`).

### 1.6 Marketing
- UC-21 CRUD marketing campaigns (`POST /marketing/add`, `GET /marketing/get/all`, `GET /marketing/delete/{id}`, `GET /marketing/get/{id}`, `POST /marketing/update`: employee_id, date, cardDistributed, remarks).

### 1.7 Internal Chat
- UC-22 List chat-able active users (`GET /chat/users`).
- UC-23 List my chats with last message + unread count (`GET /chat/chats`).
- UC-24 Get chat by id / all chats (`GET /chat/chats/{id}`, `GET /chat/all`).
- UC-25 Get paginated messages + auto mark-as-read (`GET /chat/chats/{id}/messages`).
- UC-26 Send text/image/file/video message with optional upload (`POST /chat/messages` → `chat-files/`).
- UC-27 Delete own message (or admin) (`POST /chat/message/delete`), delete chat (admin only) (`DELETE /chat/chats/{id}`).
- UC-28 Create direct/group chat with dedup (`POST /chat/create`).
- UC-29 Mark message read (`POST /chat/messages/{id}/read`), unread count (`GET /chat/unread-count`), header notifications last-10 unread (`GET /chat/header-notifications`), search chats (`GET /chat/search`).

---

## 2. Project Management (core)

### 2.1 Projects
- UC-30 Create project with images (`imageN`), documents (`documentN`), + `projectPlan JSON` auto-generating stages + 4 accounts per stage (budget Asset, expense Expense, BOQ Revenue, payables Liability) + StageActivities[] + empty Risk/Personal/Finance/Milestone/Budget/Equipment placeholders + Client Asset account (`POST /projects/add`).
  Fields: name, type, client_name, project_manager, agreement_amount, project_type, start/end dates, location, status, variation_amount.
- UC-31 Update project header; replace images/documents if `image0/document0` present (`POST /project/update`).
- UC-32 List all projects with images (`GET /projects/all`).
- UC-33 Delete project (`POST /projects/delete`).
- UC-34 Project detail by id with images/documents/stages.* + bills/manpower paid sums (`GET /project/detail/{id}`).
- UC-35 UI: ProjectList cards, AddProject form, ProjectDetails tabs, ProjectDashboard, Gantt charts (`GanttChartComponent`), CostManagement, CostComparisonChart, ResourceManager.

### 2.2 Stages
- UC-36 Add stage (auto `order` = max+1) (`POST /project/stage/add`).
- UC-37 Update stage field-dispatched (`POST /project/stage/update`, `field=`): actualStartDate, budget (reverses old Cash txn, posts new budget txn Asset↔Cash), hypotheticalCost, hypotheticalProfit, grossRevenue→BOQ.
- UC-38 Delete stage (`GET /stage/delete/{id}`), get stage by id (`GET /project/stage/getById/{id}`), list all (route exists).
- UC-39 Mark stage complete: set `actual_end_date=now`, auto-start next ordered stage (`POST /project/stage/markCompelete/`).
- UC-40 Get all stage bills (`GET /stageBills/{id}`), all stage manpowers (`GET /stageManpowers/{id}`).

### 2.3 Stage Sub-Entities (each: add/update/delete)
- UC-41 Stage Activities: task_name, start/end dates, status, priority, dependency, assigned_to, notes, final_remarks.
- UC-42 Risk Management: risk_description, likelihood, impact, mitigation_plan, status, owner, notes.
- UC-43 Resource Personnel: skill_id, quantity, planned dates, status, notes.
- UC-44 Resource Finance: expense_description, expected_amount, planned dates, status, notes.
- UC-45 Milestones: description, due_date, time_remaining, late_days, completed_date, status.
- UC-46 Budget Tracking: budget_item, estimated/actual cost, variance, status, notes.
- UC-47 Resource Equipment: equipment_id, quantity, planned dates, status, notes.

### 2.4 Procurement — Stage Bills
- UC-48 Add bill with images + line items (`material_id`, qty, rate, vat, total) + bill credits + posts Stage Expense/Asset + VAT IN accounting (`POST /project/stage/bill/add`: invoice_no, stage/project/supplier/buyer, date, tags, is_owner, amount, transport_cost, vat, discount, total_paid, balance).
- UC-49 Update bill (txn reversal + re-post), delete bill, get by id (images/credits/items), list all, list bill items via 4-table join (`POST .../bill/update`, `GET /project/stage/delete/{id}`, `GET /project/stage/getById/{id}`, `GET /project/stage/get/all`, `GET /bills/items/get/all`).
- UC-50 UI: BillsList, BillsContainer tabs, AddBill, GenericGrid, PrintableInvoice, ItemsSearch, ToggleColumnsModal, BillsImageList.

### 2.5 Site Costs
- UC-51 Daily Petrol Cost CRUD with photo + Expense/Asset txn (`POST /dailyPetrolCost/add|update`, `GET .../delete/{id}|getById|get/all`: employee/project/stage, date, petrol_cost).
- UC-52 Overhead Cost CRUD, no accounting (`POST /overHeadCost/add|update`, `GET ...`: discription, date, amount).
- UC-53 Petty Cash CRUD; if `status==Approved` posts Expense/Asset txn; list joins employee/project/stage names (`POST /pettyCash/add|update`, `GET ...`: employee/project/stage, description, amount, date, status, image).

---

## 3. HR Management

### 3.1 Employees
- UC-54 Add employee: photo upload, random password, auto-create User + Employees + 2 Accounts (Salary-Payable Liability, Salary-Expense) (`POST /employee/add`: name, email, phone, initial_salary, bank, labour_card, designation, joining_date, nationality, passport, etc.).
- UC-55 Update employee + User + photo replace/keep (`POST /employee/update`).
- UC-56 List all with visa subset (`GET /employee/get/all`), delete (`GET /employee/delete/{id}`).
- UC-57 Employee detail / by-date with full relations (visa, certificates, salary, tickets, assetIssued, medical, insurance, allotment, accommodation, leave) + computed salary (`initial_salary/26/9*hours + bonus - deduction`) (`GET /employee/get/{id}`, `POST /employee/get/date`).
- UC-58 UI: EmployeeList, AddEmployee, EmployeeDetails (10 tabs), SalaryCalculation, EmployeeHierarchy d3-org-chart, HRDashboard, HRModules wheel nav.

### 3.2 Attendance & Payroll
- UC-59 Bulk time-in today (`POST /employee/attendence/timeIn`), time-out with hours→daily-salary + Expense→Liability txn (`POST .../timeOut`), today's allotment+attendance list (`GET /employee/attendence/all`).
- UC-60 Payroll current month per-employee hours/salary/bonus/deduction/status (`POST /payroll/current/month`).
- UC-61 Bulk bonus/deduction upsert (`POST /employee/bonusDeduction/add`), bulk salary processing (`POST /employee/salery/process` → SalaryTransactions).
- UC-62 UI: AttendenceRecord, AttendanceSheet, PayrollList, EmployeePayrollDetails.

### 3.3 Employee Lifecycle Sub-Entities (each add/update/delete unless noted)
- UC-63 Visas (visa_type/expiry/renewal/duration/cost + Cash↔Expense txn with reversal).
- UC-64 Leave Requests (date_from/to, reason, status).
- UC-65 Accommodations (date_allotment, room_history, room_no, status) + LaborAccommodation UI.
- UC-66 Certificates (type, description, issued_date, document upload).
- UC-67 Salary Transactions (date, type, basic/bonus/deduction/overtime/net, bank).
- UC-68 Allotments (employee→incharge/project/stage, start/end dates) — also auto-created from ForemanReporting.
- UC-69 Insurance (cost, renewal_date, status + Cash txn + reversal).
- UC-70 Medical (date, cost, description, status + Cash txn + reversal).
- UC-71 Asset Issued (asset_id, date, cost).
- UC-72 Tickets (ticket_type, date, trip_type, cost).
- UC-73 Yearly Certificates + renewal history snapshot on update + list with renewals (`GET .../get/all`).
- UC-74 Office Assets (name, description, cost).
- UC-75 Hiring/Recruitment (candidate_name, position, department, document, vaccination_status, status) + get all/by id.

---

## 4. Operations (Site Execution)

- UC-76 Daily Manpower: add (image + paid→Expense/Asset stage txn), balance clear (`ids[]`), update/delete (txn reverse), list/detail (`POST /dailyManpower/add|balance/clear|update`, `GET .../delete|get/all|get/{id}`: date, name, phone, skill, project/stage, rate, workDoneEval, paid, balance, foreman).
- UC-77 Rental Tools: CRUD + stage accounting (tool_name, hire/return dates, project/stage, rental_shop, rate_per_day, paid, balance).
- UC-78 Own Tools inventory CRUD (tool_name/type/id, qty, condition, purchased_price) + list with issuance+maintenance.
- UC-79 Tool Issuance: bulk issue (`issued_ids[]`), update, return (`return_ids[]`, `rate*days`, txn, return_date=now), delete, list/detail (own_tool, project/stage, qty, rate, issued_to, dates).
- UC-80 Maintenance History CRUD (own_tool, date, description, cost).
- UC-81 Foreman Reporting: add/update/delete/list/detail with going/end/work images (`goingImageN/endImageN/workImageN`), `employeesList JSON` → ForemanReportingEmployeesList + Allotment, optional `nextDayPlan` creates pending next-day report (employee/project/stage/date/status/descriptions/remarks).
- UC-82 Daily Work Reporting CRUD with `imageN` uploads (date, description, employee).
- UC-83 Daily Transports CRUD with photo + stage accounting (project/stage, date, transporter_party, work_type, rate, paid).
- UC-84 Subcontractor Tasks CRUD with paymentPlans[] nested create + `initial_amount_paid` txn (subcontractor/project/stage, date, work, agreement_amount).
- UC-85 Payment Plans: add/edit/delete/paid (`paid` posts subcontractor cost txn + status=paid; amount, status, date, work_description).
- UC-86 Material Required: add header + `MaterialRequiredLineItem[]`, delete, list with items (no update route; project/stage/employee, notes, activity).
- UC-87 UI: DailyManpowerList/AddManpowerForm/ManpowerReceipt/InvoicePreview, ToolsList tabs/IssueToolDrawer/ReturnToolDrawer, WorkRequiredList/LogRequirement, ForemanReportingList/AddNextDayPlan, SubcontractorTasksList/Agreement, TransportList/AddTransportForm/ReceiptPreview.

---

## 5. Configuration / Masters

Each master = add/update/delete/getAll/getById (exceptions noted):
- UC-88 Materials (name, type, remarks).
- UC-89 Suppliers / Sappliers (name, email, phone, trn_no).
- UC-90 Subcontractors (name, email, phone).
- UC-91 Vehicles / Vehicals (type, plate_no, mulkya/insurance expiry, purchase/mulkiya/total cost) + detail with drivers/maintenance/fines.
- UC-92 Vehicle Maintenance (vehicle, date, cost, description, type, recurring_duration).
- UC-93 Vehicle Drivers (employee, vehicle, license/contact nos, handover/return dates, license_expiry).
- UC-94 Vehicle Fines (vehicle, driver, amount, reason, workted_at).
- UC-95 Document Management (project, document upload → `storage/app/public/documents/`, version, name, uploaded_by, description).
- UC-96 Professions/Skills (name only; add/delete/list, no update).
- UC-97 Quotations / Qutations + QuotationItems[] (client/project/date/description/amount/status/document upload; update deletes/recreates items + old doc).

---

## 6. Finance & Accounting (double-entry)

- UC-98 Chart of Accounts CRUD (`POST /account/add|update`, `GET /account/get`: name, project/stage/employee/subcontractor/vehicle links, description, type, category, balance).
- UC-99 Post double-entry transaction: determine debit/credit via `AccountsTrait`, create Transaction + 2 TransactionDetails, update balances (`POST /transaction/add`: accountFrom/To, amount, date, description).
- UC-100 Delete transaction, list with details, details by account (`GET /transaction/delete/{id}`, `GET /transaction/getAll`, `GET /transaction/details/{id}`).
- UC-101 Payables (Liability details) / Receivables (Asset details) (`GET /account/payablesGet`, `/account/recieveablesGet`).
- UC-102 Financial statements: Income Statement (Revenue−Expense), Profit & Loss, Balance Sheet (Asset/Liability/Equity) (`GET /income/statement/get`, `/profitLoss/statement/get`, `/balance/sheet/get`).
- UC-103 UI: AccountsList, AccountsTabs, Payable/Receivable, AddAccountDrawer, LedgerManagement/Detail, TransactionsList/AddTransactionDrawer/DetailDrawer, FinancialStatements, ProjectFinancialManagement, FinanceDashboard, FinancialAnalytics, TaxDashboard.

---

## 7. Data Model Summary (for Supabase port)

~85 tables. Key groups:
- Identity: users, roles, user_roles, permissions, role_permissions, theme_settings, grid_settings, todo_works.
- Chat: chats, chat_participants, chat_messages, chat_message_reads.
- Projects: projects, project_images, documents, stages, stage_activities, stage_costs, risk_management, resource_personals/finances/equipment, milestones, budget_trackings.
- Procurement/costs: bills, bill_images/line_items/credits, tags/bill_tags, daily_petrol_costs, over_head_costs, petty_cashes, materials, material_requireds + line_items, suppliers, quotations + items, subcontractors + tasks + payment_plans.
- HR: employees, attendances, leave_requests, accommodations, certificates, salary_transactions, allotments, visas, insurances, medicals, asset_issueds, tickets, yearly_certificates + renewl_histories, office_assets, hirings, departments, marketings.
- Fleet/tools/ops: vehicals, vehical_drivers, vehicle_maintenances/fines, owned_tools, rental_tools, tool_issuances/issued_histories, maintenance_histories, daily_manpowers + work_images, daily_transports + images, daily_work_reportings + images, forman_reportings + images/employees_lists, daily_duties/duty_employees, work_images/evalutions.
- Finance: accounts, account_types/categories, transactions, transaction_details, ledgers, financial_statements, clients.
See `database/migrations/2024_10_18_000001–000073` as canonical schema; note typos to fix in new schema: `vehicals, sapplier, qutation, wellcome, forman, discription, workted_at, recieveables, salery, uncompelete, renewl`.

---

## 8. Target Enhancements (Next.js + Supabase + R2)

1. Fix naming/typos, proper FKs, RLS per company/role, audit columns (`created_by/updated_by`, soft deletes).
2. Replace local `storage/app/public/*` with Cloudflare R2 (buckets: `images`, `documents`, `chat-files`; signed URLs; image transforms).
3. Supabase Auth (email/phone/username) + storage policies; migrate Sanctum tokens; RBAC via `roles/permissions` tables + RLS + Next.js middleware.
4. Server Components + Server Actions / Route Handlers; TanStack Query; replace Redux with Zustand or keep Redux Toolkit; shadcn/ui + Tailwind; AG-Grid or TanStack Table; Recharts + Gantt (e.g. frappe/gantt-task-react successor).
5. Realtime: Supabase Realtime for chat, foreman reporting, notifications (replace polling).
6. Accounting integrity: Postgres functions for double-entry post/reverse (replace `AccountsTrait`), immutable ledger, trial-balance RPCs for Income/P&L/Balance Sheet, payroll RPC.
7. File pipeline: Next.js upload → R2 presigned URL → Supabase row; VAT/bill OCR future; PDF receipts via `react-pdf` / server PDF.
8. Mobile/PWA: foreman time-in/out, photo capture, offline queue; Arabic/English i18n (UAE labour context: visa/mulkia/labour card).
9. Reporting: project BOQ vs actual, stage budget variance, manpower/transport daily summaries, vehicle cost, payroll month close.
10. Migration steps: (a) Supabase schema from §7, (b) seed masters (skills, account types), (c) R2 buckets + CORS, (d) Next.js routes mirroring §1–6, (e) data import scripts from MySQL, (f) UAT per use-case.

---

## 9. Route → Use-Case Traceability (abridged)

`routes/web.php` (auth:sanctum group) + `routes/api.php` (`POST /login`) map 1:1 to UC-01–UC-103 above. Controllers: `AuthController` (UC-01), `WellcomeController` (UC-06–18, todos, marketing, users/roles), `ChatController` (UC-22–29), `ProjectController` (UC-30–53), `ConfigurationController` (UC-88–97), `HRController` (UC-54–75), `OperationController` (UC-76–86), `FinanceController` (UC-98–103).
