# EC-RMS Specification (v0.1, week 1)

Elderly Center Resident Management System. This document is the source of truth for scope. Anything not listed here is out of scope for the 3-week build and goes in [Later](#9-later-after-the-course-demo).

- **Users:** center staff (Admin, Operator) and residents' relatives.
- **Goal:** staff keep each resident's care record in one place; each relative sees only their own family member's information.
- **Stack:** React (Vite) + React Router · Node.js + Express · MySQL (managed with phpMyAdmin).
- **Interface language:** Vietnamese (code, API and docs in English).
- **Deadline:** demo around 16 Dec 2026, with weekly progress reports.

---

## 1. Roles and permissions

| | Admin | Operator | Relative |
|---|---|---|---|
| Log in / log out | ✓ | ✓ | ✓ (after activating the invite) |
| View all residents (list, search, filter, sort) | ✓ | ✓ | ✗ |
| Create / edit residents and their records | ✓ | ✓ | ✗ |
| Archive a resident | ✓ directly, with a reason | Request only, Admin approves | ✗ |
| Approve / reject archive requests | ✓ | ✗ | ✗ |
| Create staff and relative accounts, send invites | ✓ | ✗ | ✗ |
| Link a relative to a resident, set access level | ✓ | ✗ | ✗ |
| Promote a user to Admin / create an Admin | ✓ | ✗ | ✗ |
| Disable an account | ✓ (never the last active Admin) | ✗ | ✗ |
| View audit log | ✓ | ✗ | ✗ |
| View their linked resident(s) | – | – | ✓ read-only |

Rules enforced **on the server** (hiding buttons in React is not enough):

1. Every relative request is filtered through `resident_relatives` where `active = 1`. A relative asking for any other resident gets `404 Not Found` (not 403, so IDs can't be probed).
2. Only Admins can change roles. The last active Admin cannot be demoted or disabled.
3. An Operator's archive request cannot be approved by the same user. With a single Admin, the Admin archives directly with a mandatory reason. Both paths are written to the audit log.

### Relative access levels

| Data | `full` | `basic` |
|---|---|---|
| Profile (name, photo, room, status) | ✓ | ✓ |
| Schedule (activities, appointments) | ✓ | ✓ |
| Weekly summaries | ✓ | ✓ |
| Allergies and health conditions | ✓ | ✗ |
| Medications | ✓ | ✗ |
| Vital signs | ✓ | ✗ |
| Care notes marked *visible to family* | ✓ | ✗ |
| Care notes marked internal | ✗ | ✗ |

`full` is for the legal guardian or main contact; `basic` is for other relatives. A resident can have several relatives.

---

## 2. Key flows

### 2.1 Relative account (center-created, no public sign-up)

1. The resident is admitted and the center records consent (who may see what) at admission.
2. The Admin creates the relative's account (name, email, phone), links it to the resident with a relationship and access level, and records consent (who and when).
3. The server creates a single-use activation token (stored hashed, expires in 72 hours) and returns an activation link.
4. The link is sent by email automatically (SMTP), and the Admin can copy it to send by Zalo.
5. The relative opens the link, sets their own password (hashed with bcrypt), accepts the privacy notice and is logged in. This activation page is the app's **registration** step.
6. Expired or used links show a clear error, and the Admin can resend a new one.

Staff accounts use the same invite flow.

### 2.2 Archiving a resident (soft delete)

Records are never hard-deleted in normal use. "Delete" means **archive**.

1. Operator clicks **Request archive** on a resident and enters a reason.
2. A `deletion_requests` row is created with status `pending` (max one pending request per resident).
3. Admin sees it on the **Approvals** page and approves or rejects with a note.
4. On approve, in one transaction: resident `status = 'archived'`, `archived_at` set, request marked `approved`, audit entry written.
5. Archived residents are hidden from the default list but can be shown with a filter and restored by the Admin.

Status changes such as *hospital*, *discharged* or *deceased* are ordinary edits and don't need approval.

### 2.3 Weekly summary (AI bonus, week 3)

Once a week, staff click **Generate summary** for a resident. The server sends that week's family-visible notes, vitals and medication info to Claude Haiku 5.5 and saves the draft. Staff review and edit it, then publish it so relatives can see it. Cost estimate: about 6 US cents a month for 30 residents. Without an API key the button is hidden and staff can write the summary by hand.

---

## 3. Data to record and how often

| Section | What | Who records | How often |
|---|---|---|---|
| Profile | name, date of birth, gender, photo, room, admission date, status, mobility, fall risk, diet, cognitive status, usual doctor and hospital | Operator | at admission, then on change |
| Allergies | allergen, type (drug / food / other), reaction, severity | Operator | on change |
| Health conditions | condition, since when, notes | Operator | on change |
| Medications | name, dose, route, times of day, instructions, start/end, prescriber | Operator | on change |
| Medication log *(stretch)* | given / missed / refused for each dose | Operator | each dose |
| Vital signs | blood pressure, pulse, temperature, SpO2, weight, blood sugar | Operator | daily (weight weekly) |
| Care notes | category (daily, health, incident, activity), note, visible to family? | Operator | daily, incidents right away |
| Schedule | activities, appointments, therapy, visits | Operator | as planned |
| Weekly summary | short text for the family | Operator (AI draft) | weekly |

---

## 4. Screens (React Router)

| Path | Screen | Roles |
|---|---|---|
| `/login` | Login | all |
| `/activate/:token` | Set password and accept privacy notice (registration) | invited users |
| `/` | Redirects by role: staff go to `/residents`, relatives go to `/family` | all |
| `/residents` | Resident list: search by name or code, filter by status and fall risk, sort by name, room or admission date, pagination | Admin, Operator |
| `/residents/new` | Create resident (validated form) | Admin, Operator |
| `/residents/:id` | Resident detail with tabs: Profile · Allergies and conditions · Medications · Vitals · Care notes · Schedule · Summaries · Relatives | Admin, Operator |
| `/residents/:id/edit` | Edit resident | Admin, Operator |
| `/family` | My family member(s): cards (list view) | Relative |
| `/family/:residentId` | Read-only detail (tabs limited by access level) | Relative |
| `/admin/users` | Staff and relative accounts: create, invite, change role, promote to Admin, disable | Admin |
| `/admin/approvals` | Pending archive requests | Admin |
| `/admin/audit` | Audit log with filters | Admin |
| `*` | Not found | all |

Every data screen handles four states: **loading** (skeleton), **empty** (friendly message and a call to action), **error** (message and retry), and **success** (toast after saving).

Layout: a sidebar on desktop that turns into a hamburger menu under 768px. Tables turn into cards on mobile.

---

## 5. REST API

Base path `/api`. JSON responses always have the same shape:

```json
{ "success": true,  "data": { ... }, "meta": { "page": 1, "pageSize": 20, "total": 57 } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [{ "field": "dateOfBirth", "message": "…" }] } }
```

Status codes: `200` OK, `201` created, `204` no content, `400` validation, `401` not logged in, `403` wrong role, `404` not found (or not yours), `409` conflict (e.g. a pending request already exists), `500` server error (from the central error handler).

Auth: JWT in an **httpOnly, Secure, SameSite=Lax cookie** (not localStorage). Passwords hashed with bcrypt (cost 12). Login is rate-limited.

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| POST | `/auth/login` | public | Log in |
| POST | `/auth/logout` | logged in | Log out (clear cookie) |
| GET | `/auth/me` | logged in | Current user |
| GET | `/auth/invites/:token` | public | Check an activation link |
| POST | `/auth/activate` | public | Set password with token (registration) |
| GET | `/residents?q=&status=&fallRisk=&sort=&order=&page=` | staff | List, search, filter, sort |
| POST | `/residents` | staff | Create |
| GET | `/residents/:id` | staff | Detail |
| PUT | `/residents/:id` | staff | Update |
| POST | `/residents/:id/archive-requests` | Operator | Request archive |
| POST | `/residents/:id/archive` | Admin | Archive directly (reason required) |
| POST | `/residents/:id/restore` | Admin | Restore from archive |
| GET/POST | `/residents/:id/allergies` | staff | List / add |
| PUT/DELETE | `/allergies/:id` | staff | Edit / remove (sub-records can be deleted; audited) |
| GET/POST | `/residents/:id/conditions` | staff | List / add |
| PUT/DELETE | `/conditions/:id` | staff | Edit / remove |
| GET/POST | `/residents/:id/medications` | staff | List / add |
| PUT/DELETE | `/medications/:id` | staff | Edit / stop (soft: `active = 0`) |
| GET/POST | `/residents/:id/vitals` | staff | List / record |
| GET/POST | `/residents/:id/care-notes` | staff | List / add |
| PUT/DELETE | `/care-notes/:id` | staff | Edit / remove |
| GET/POST | `/residents/:id/schedules` | staff | List / add |
| PUT/DELETE | `/schedules/:id` | staff | Edit / remove |
| GET | `/residents/:id/summaries` | staff | List summaries |
| POST | `/residents/:id/summaries/generate` | staff | AI draft (week 3) |
| PUT | `/summaries/:id` | staff | Edit / publish |
| GET | `/archive-requests?status=pending` | Admin | Approvals queue |
| PATCH | `/archive-requests/:id` | Admin | Approve / reject |
| GET | `/users?role=&q=` | Admin | List accounts |
| POST | `/users` | Admin | Create account and invite |
| PATCH | `/users/:id` | Admin | Edit, change role, disable |
| POST | `/users/:id/resend-invite` | Admin | New activation link |
| GET/POST | `/residents/:id/relatives` | Admin | List / link relative (with consent) |
| PATCH | `/resident-relatives/:id` | Admin | Change access level, unlink |
| GET | `/audit-logs?actor=&entity=&from=&to=` | Admin | Audit log |
| GET | `/family/residents` | Relative | My linked residents |
| GET | `/family/residents/:id` | Relative | Detail, filtered by access level |

---

## 6. Validation (frontend **and** backend)

The same rules are written once as schemas (Zod on the server, mirrored in React forms):

- **Resident:** full name 2 to 100 characters; date of birth in the past with age 50 to 120; admission date not in the future; status from the allowed list; room up to 20 characters.
- **Medication:** name and dose required; times in `HH:MM`; end date not before start date.
- **Vitals:** blood pressure 50–250 / 30–150; pulse 30–200; temperature 34–42 °C; SpO2 50–100 %; weight 20–200 kg. Values outside the usual range are allowed but flagged.
- **User:** valid email, unique; Vietnamese phone format; password at least 8 characters with a letter and a number.
- **Archive request / direct archive:** reason at least 10 characters.

---

## 7. Privacy and security basics

- `.env` is never committed; `.env.example` lists every variable with placeholder values.
- Health data is shown to relatives only through a link recorded with consent (who recorded it and when).
- An audit log records create, update, archive, role changes, relative links and logins. It is insert-only, and log text holds no health details beyond IDs.
- Use **only fake sample data** for the class demo. Before real resident data goes in, the center needs written consent and a data-protection impact assessment under Vietnam's Personal Data Protection Law (Law 91/2025, Decree 356/2025), and should keep the database on hosting in Vietnam. See the research report in the project files. This is not legal advice.

---

## 8. Course requirement checklist

| Requirement | Where it's met |
|---|---|
| At least two user roles | Admin, Operator, Relative (§1) |
| Register, login, logout, hashed passwords | Invite activation as registration, `/auth/*`, bcrypt (§2.1, §5) |
| Core CRUD | Residents and their records (§5) |
| List and detail views | `/residents`, `/residents/:id`, `/family`, `/family/:id` (§4) |
| Search plus filter or sort | `q`, `status`, `fallRisk`, `sort` on the resident list (§4, §5) |
| Access control | Role middleware and relative link filter (§1) |
| Frontend and backend validation | Shared rules (§6) |
| Loading, empty, error, success states | Every data screen (§4) |
| React components, Router, hooks | `client/` (§10) |
| REST API, proper methods and status codes | §5 |
| Routes / controllers / services / models | `server/` layout (§10) |
| Central error handling, consistent responses | Error middleware, response shape (§5) |
| Secrets in `.env`, not committed | `.gitignore`, `.env.example` |
| At least 3 main tables with PK/FK | 10 main tables + 3 workflow tables (see [ERD](ERD.md)) |
| No unnecessary redundancy | Normalized schema (see ERD notes) |
| Sample data | `database/seed.sql` |
| Git with branches, every member commits | Feature branches and PRs; see §11 |
| README: install, `.env`, run | README (week 3) |
| ERD | [docs/ERD.md](ERD.md) |
| Bonus: AI feature | Weekly summary (§2.3) |
| Bonus: public deploy | Subdomain of the center's site (week 3) |

---

## 9. Later (after the course demo)

- Automatic Zalo messages (needs a verified Zalo Official Account)
- Medication log reminders and missed-dose alerts
- Contacts who have no account (doctor, neighbour)
- Notifications to relatives when an incident is recorded
- Hard purge after the retention period (Admin only)
- English interface

---

## 10. Repository layout

```
ec-rms/
├── client/              React (Vite) app
│   └── src/
│       ├── api/         fetch wrappers
│       ├── components/  shared UI (Table, Form fields, StateViews, Layout)
│       ├── features/    residents/, family/, admin/, auth/
│       ├── hooks/       useAuth, useFetch, useDebounce
│       ├── routes/      router and route guards
│       └── validation/  form schemas
├── server/              Express API
│   └── src/
│       ├── config/      env, db pool
│       ├── routes/
│       ├── controllers/
│       ├── services/    business rules
│       ├── models/      SQL queries
│       ├── middlewares/ auth, requireRole, validate, errorHandler
│       ├── validators/  Zod schemas
│       └── utils/
├── database/
│   ├── schema.sql
│   └── seed.sql
├── docs/                SPEC.md, ERD.md
├── .env.example
└── README.md
```

---

## 11. Timeline and team

| Week | Dates | Deliverable for the weekly report |
|---|---|---|
| 1 | 26 Nov to 2 Dec | Spec and ERD · repo scaffold · schema and seed · login, logout, activation · role middleware |
| 2 | 3 to 9 Dec | Resident CRUD and list (search, filter, sort) · detail tabs · relative view · archive approvals · user admin |
| 3 | 10 to 16 Dec | Validation and UI states polish · audit log page · AI summary · README · deploy to subdomain and WordPress menu link · demo rehearsal |

Each teammate owns one area on their own branch from early week 2 (suggested: **Member 2** does medications, vitals and schedule; **Member 3** does the relative view, README and ERD image). Leah owns auth, residents and admin. All work merges through pull requests.
