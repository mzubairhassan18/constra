# Test Accounts — Constra (LOCAL TESTING ONLY)

> ⚠️ These are throwaway test credentials with known passwords.
> Rotate or delete them under Dashboard → Users before onboarding real users
> or demoing to anyone outside the team. Never reuse these passwords elsewhere.
>
> ⚠️ Sessions embed permissions at login — after any role/permission change,
> **sign out and sign back in** or you will keep the old menu set.

Live app: `https://constra.mzubairhassan18.workers.dev`
Sign in: `/login` (role tabs pre-select the matching username hint).
Each role lands on its own home and sees only its menus.

| Role | Username | Password | Lands on | Sees |
|---|---|---|---|---|
| Owner (super admin) | `admin` | `S62gWaWg3T_T` | `/dashboard` | everything |
| Owner (admin role) | — create via Users | — | `/dashboard` | company overview, projects, bills, finance, operations, fleet, masters, chat, AI — **no HR** (by design) |
| Accountant | `accountant` | `8mxBKC4u1AZM` | `/finance` | finance, bills, masters, projects (read), chat, AI |
| Foreman | `foreman` | `rf20Edb73-tN` | `/operations` | **My work** (postings + attendance), reports, requests, manpower, projects (read), chat |
| HR officer | `hr` | `EiCRfOU_3fTN` | `/hr` | employees, assignments, attendance, projects/operations (read) |
| Client | `client` | `QWIUJFLEDtUL` | `/client` | own project workspace only: progress, dues, updates, photos, messaging |

Suggested test tour:

1. **admin** — Projects (create villa + stages), project page → link `client`
   login under “Client workspace login”, Finance (trial balance Dr = Cr),
   chat with the team, 🔔 bell → Notification center → Open → deep links.
2. **accountant** — Bills (post supplier bill → admins get notified), Finance
   (issue invoice → record receipt → payment notification).
3. **foreman** — Operations → My work (empty until HR links an employee record),
   file a daily report with photo → admins get “Report filed” notification;
   create material request → admin approves → foreman gets “request decided”.
4. **hr** — HR (add employee, assign to project → assignment notification,
   log attendance → stage labour cost updates).
5. **client** — /client shows linked project: progress %, dues, updates, photos;
   send a message → admins get “Client message” notification linking to /client.

Menu/permission map (`db/migrations/0011_roles_access.sql` is the source of truth):

- super_admin `["*"]` — everything, incl. Users (roles) management.
- admin — projects/finance/bills/operations/fleet/masters + chat. No HR, no Users.
- accountant — finance/bills + projects/masters read + chat.
- foreman — operations (incl. reports/requests/manpower) + attendance + projects read + chat.
- hr — hr (employees/assignments/attendance; write = create/assign) + projects/operations read.
- client — portal only; lives in /client, never sees the staff shell.

Reset a password: Dashboard → Users → Reset (super_admin), or bcrypt-hash a new
password into `users.password_hash`.
