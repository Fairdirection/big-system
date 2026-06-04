# CLAUDE.md — FairDirection SalesFlow

## CRITICAL GUARDRAILS (read first, always)
- **NEVER hard-delete** employees, clients, or any business record — use `isActive: false` soft-delete only
- **NEVER bypass TypeScript** — run `npx tsc --noEmit` after every frontend change; fix all errors before proceeding
- **NEVER commit** credentials, `.env` files, or JWT secrets
- **NEVER modify** `commission.service.js` logic without confirming the change against `commission_rules.txt`
- **NEVER drop or rename** MongoDB collections — migrations only; data loss is unrecoverable
- Write **no comments** unless the WHY is non-obvious; no docstrings; no task-reference comments
- If Claude makes the same mistake twice → add a rule here so it's fixed for all future sessions

## Project
FairDirection SaaS ("SalesFlow") — real estate commission management platform.
Tracks: employees, teams, clients, sales → quarterly commission calculation with role-based tiering.

Stack: Node.js/Express + MongoDB (backend) · Angular 20 + Tailwind CSS (frontend) · monorepo root

## Dev Commands
```
npm run dev           # root: starts backend + frontend concurrently
npm run install:all   # install all deps
```
Backend (`salesflow-backend/`): `npm run dev` (nodemon) | `npm start` | `npm run seed`
Frontend (`salesflow-frontend/`): `npm run dev` (port 4200) | `npm run build` | `npm run typecheck`

Env: copy `.env.example` → `.env`, set `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL=http://localhost:4200`

## Architecture
Monorepo. Backend MVC+service layer: `routes/` → `controllers/` → `services/` → `models/`
All API routes: `/api/v1`. Auth: JWT in httpOnly cookie **and** `Authorization: Bearer` header.
Validators: Joi schemas via `middleware/validate.middleware.js`

**Key business logic:**
- `services/commission.service.js` (27KB) — slab-based commission by role
- `utils/quarter.utils.js` — working-day quarter calculations
- `services/target.service.js` — adjusted target recalc on team transfers

**Data conventions:**
- Soft delete: `isActive` flag
- Denormalized names in Sale: `employeeName`, `clientName` for query perf
- Quarter IDs: `"Q1-2026"`, `"Q2-2026"` etc.
- Sale shares: 1-4 sellers, shares must sum to 100%

**Core entity chain:** User (admin) → Employee → Team (via EmployeeTeamHistory) → Sale → Claim → CommissionPayout → QuarterlySettlement / QuarterlyTarget

**Sale status flow:** `draft` → `confirmed` → `claimed` → `collected`

## Frontend Conventions
Angular 20 standalone components, `ChangeDetectionStrategy.OnPush`, signals + RxJS.
Feature modules lazy-loaded: `employees, teams, sales, clients, claims, commissions, dashboard, targets, audits, settings, auth`
State: Angular signals in services (no NgRx). `computed()` for derived UI state.
Interceptors: `authInterceptor` (attaches Bearer) · `errorInterceptor` (clears state on 401)
Dev proxy: `proxy.conf.json` → `localhost:3000` for `/api/v1`
i18n: `@ngx-translate` Arabic (`ar-EG`) / English, persisted in localStorage
Path aliases: `@core/*` · `@shared/*` · `@features/*` · `@env/*`

## UI Design System (Tailwind)
CSS tokens: `--sf-bg`, `--sf-primary`, `--sf-muted`, `--sf-text`, `--sf-border`
Glassmorphism surfaces · neon glow: purple, cyan, pink, green
Status badges: `draft` / `confirmed` / `claimed` / `collected`
Fonts: Cairo (display) · DM Sans (body) · JetBrains Mono (code)
Brand name: **FairDirection** (never "fair direction", never "فير دايراكشن")

**Card overflow rule:** For KPI/stat cards with large numbers — label+icon in top flex row (`shrink-0` on icon), number full-width below with `font-size: clamp(0.95rem, 2.5vw, 1.5rem)` + `break-words`

## Print System
Shared print util: `@core/utils/print.utils.ts` — exports `openPrintWindow`, `printBanner`, `printFooter`, `printFmt`, `statusPill`
All feature components have a print button with `heroPrinter` icon (ng-icons)
Print design: official document style, purple banner, bordered tables, Cairo font

## Commission Business Rules
See `commission_rules.txt` and `salesflow-backend/README.md`
- Roles: Fresh → BA → BC → Senior → SV → TeamLeader
- Achievement-slab-based commission per role
- Personal-source vs company-source: different rate tables
- Taxes: VAT 14%, withholding tax 5%
- Quarterly targets adjusted for actual working days; recalculated on team transfer

## Response Style
- Terse. No trailing summaries — user can read the diff
- No emojis unless user requests
- Reference file paths as `path/to/file.ts:lineNumber`
- When making changes: state what changed in one sentence; state what's next if anything remains
