# Team guide

A short guide for team members: how to run the app, how the code is organised, how to make changes without breaking anyone else's work, and how to explain the project in the demo.

## 1. Run the app on your computer

Follow the [README](../README.md). In short:

1. Install Node.js 20+ and XAMPP (MySQL + phpMyAdmin).
2. In phpMyAdmin, import `database/schema.sql`, then `database/seed.sql`.
3. `cd server`, copy `.env.example` to `.env`, run `npm install`, then `npm run dev` (API on port 4000).
4. In a second terminal: `cd client`, `npm install`, `npm run dev`, then open http://localhost:5173.

Demo accounts (password `Demo@1234`):

| Email | Role | What to try |
|---|---|---|
| `admin@ecrms.test` | Admin | Everything, plus approvals, accounts and the audit log |
| `operator1@ecrms.test` | Operator | Resident records, care notes, vitals |
| `lan.nguyen@ecrms.test` | Relative (full access) | Family view with health details |
| `hoa.le@ecrms.test` | Relative (basic access) | Family view with summary and schedule only |

If you change `seed.sql`, import `schema.sql` and `seed.sql` again so the database starts clean.

## 2. How the code is organised

```
client/src/
  api/          one file per area; functions that call the server
  components/   small shared pieces (Badge, Modal, FormField, Pagination…)
  features/     one folder per screen area (residents, admin, family, auth)
  hooks/        useAuth, useFetch, useToast…
  routes/       guards that block pages by role
  utils/        Vietnamese labels and date formatting
  validation/   form checks before sending to the server

server/src/
  routes/       URL → which controller, plus who is allowed (authenticate, requireRole)
  validators/   Zod schemas that check every request
  controllers/  read the request, call a service, send the response
  services/     the business rules (who may do what, audit log, transactions)
  models/       SQL queries
  middlewares/  auth, validation, central error handler
```

### What happens when a page loads data

Example: an operator opens a resident's medications.

1. **React** `MedicationsTab.jsx` calls `careApi.listMedications(id)` from `client/src/api/care.js`.
2. That sends `GET /api/residents/1/medications` with the login cookie.
3. **Route** `server/src/routes/care.routes.js` checks the user is logged in and is admin or operator, then validates the `id`.
4. **Controller** `care.controller.js` calls the service.
5. **Service** `care.service.js` checks the resident exists and calls the model.
6. **Model** `care.model.js` runs the SQL query with `?` placeholders (this prevents SQL injection).
7. The response comes back as `{ success: true, data: [...] }`. On any error, `middlewares/errorHandler.js` sends `{ success: false, error: { code, message } }`.

## 3. Git workflow (please follow exactly)

Do this once:

```bash
git clone https://github.com/Billie0903/ec-rms.git
cd ec-rms
git config user.name "Your Name"
git config user.email "the-email-on-your-github-account"
```

For each task:

```bash
git checkout main
git pull                                  # always start from the latest main
git checkout -b feature/your-branch-name  # the branch name is given in your issue
# ...edit files...
git add <the files you changed>
git commit -m "Short sentence saying what you did"
git push -u origin feature/your-branch-name
```

Then open a pull request on GitHub into `main` and write `Closes #<issue number>` in the description.

Rules that keep everyone's work safe:

- **Never push to `main`.** Only pull requests go into `main`.
- **Only change the files your issue lists.** Other files are being changed by someone else at the same time.
- **One commit per step** in your issue. Small commits are easier to review and to explain.
- **Never commit** `.env`, `node_modules/` or `dist/`.
- If GitHub says your PR has a conflict, don't try to fix it alone. Comment on the PR and Leah will sort it out.
- Before you push, check the app still starts and `npm run build` in `client/` still works.

## 4. Questions the lecturer may ask (and short answers)

- **Why three layers on the server (routes, controllers, services, models)?** Each layer has one job: URLs and permissions, request handling, business rules, and SQL. That makes the code easier to test and change.
- **How are passwords stored?** Hashed with bcrypt (cost 12). We never store or log the plain password.
- **How does login work?** The server signs a JWT and stores it in an httpOnly cookie, so JavaScript in the page can't read it.
- **How does access control work?** Every API route checks the role on the server (`requireRole`). The React guards only hide pages; the server is what really blocks access.
- **How does a relative only see their own family member?** The `resident_relatives` table links a relative to a resident. The family API checks that link on every request and returns 404 if there is none. Basic access gets fewer fields than full access.
- **Why is nothing deleted?** Health records must keep their history, so residents are archived instead. An operator requests it and an admin approves it. Every change goes into the audit log.
- **Where is validation?** In both places: `client/src/validation/` gives fast feedback in the form, and `server/src/validators/` (Zod) checks every request, because the browser can be bypassed.
- **How do relatives get an account?** The center creates it and sends a one-time activation link by email or Zalo. Only a SHA-256 hash of that link is stored in the database.
