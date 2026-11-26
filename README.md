# EC-RMS: Elderly Center Resident Management System

A web app for an elderly care center to manage residents' care records, with a private, read-only view for each resident's family.

**Stack:** React (Vite) + React Router · Node.js (Express) · MySQL

- Spec: [`docs/SPEC.md`](docs/SPEC.md)
- Database design and ERD: [`docs/ERD.md`](docs/ERD.md)

## Requirements

- Node.js 20 or newer
- MySQL 8 (or MariaDB 10.6+), managed with phpMyAdmin or the `mysql` command line

## 1. Database

1. Create a MySQL user (for example in phpMyAdmin under **User accounts**, or in DirectAdmin under **MySQL Management**).
2. Import the schema, then the sample data:
   - **phpMyAdmin:** Import tab → choose `database/schema.sql` → Go. Then do the same with `database/seed.sql`.
   - **Command line:**
     ```bash
     mysql -u root -p < database/schema.sql
     mysql -u root -p < database/seed.sql
     ```
   `schema.sql` creates a database called `ec_rms`. If your host gives you a database with a different name, remove the `CREATE DATABASE` and `USE` lines and import into your database.
3. Give your user access to it, e.g. `GRANT ALL ON ec_rms.* TO 'ec_rms_user'@'localhost';`

The sample data is fake. Every demo account's password is `Demo@1234`:

| Email | Role |
|---|---|
| `admin@ecrms.test` | Admin |
| `operator1@ecrms.test` | Operator |
| `lan.nguyen@ecrms.test` | Relative (full access) |
| `hoa.le@ecrms.test` | Relative (basic access) |

The relative `tuan.pham@ecrms.test` is not activated yet. Open `http://localhost:5173/activate/demo-invite-token-for-tuan-pham-0001` to try the registration (activation) flow. Re-import `seed.sql` to reset.

## 2. Backend (`server/`)

```bash
cd server
cp ../.env.example .env     # then edit .env: DB_USER, DB_PASSWORD, JWT_SECRET
npm install
npm run dev                 # http://localhost:4000, check http://localhost:4000/api/health
```

### `.env` settings

| Variable | What it is |
|---|---|
| `PORT` | API port (default 4000) |
| `CLIENT_URL` | Address of the React app, used for CORS and activation links |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `JWT_SECRET` | Long random string used to sign login tokens. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Login session length (default `8h`) |
| `INVITE_TTL_HOURS` | How long activation links stay valid (default 72) |
| `SMTP_*` | Mail server for sending activation links (optional in development) |
| `ANTHROPIC_API_KEY` | For AI weekly summaries (optional) |

`.env` is ignored by Git. Never commit real passwords or secrets.

## 3. Frontend (`client/`)

```bash
cd client
npm install
npm run dev                 # http://localhost:5173
```

In development, Vite forwards `/api` requests to `http://localhost:4000`, so start the backend first.

## Project structure

```
client/     React app (features/, components/, hooks/, routes/, api/, validation/)
server/     Express API (routes → controllers → services → models, plus middlewares/ and validators/)
database/   schema.sql and seed.sql
docs/       Spec and ERD
```

## Git workflow

- `main` always works. Each feature goes on its own branch (`feature/...`, `docs/...`, `fix/...`) and merges through a pull request.
- Don't commit `.env`, `node_modules/` or build output.
