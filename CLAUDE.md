# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FairDirection SaaS ("SalesFlow") is a real estate commission management platform. It tracks employees, teams, clients, sales, and calculates complex quarterly commissions with role-based tiering.

## Development Commands

### Root (runs both services concurrently)
```
npm run dev          # Start backend + frontend together
npm run install:all  # Install all dependencies in both subdirectories
```

### Backend only (`salesflow-backend/`)
```
npm run dev    # nodemon watch mode
npm run start  # production
npm run seed   # seed database
```

### Frontend only (`salesflow-frontend/`)
```
npm run dev        # ng serve with proxy (http://localhost:4200)
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run format     # prettier
npm test           # Karma unit tests
```

### Environment setup
Copy `salesflow-backend/.env.example` to `salesflow-backend/.env` and set:
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — token signing key
- `FRONTEND_URL` — CORS origin (default: `http://localhost:4200`)

## Architecture

This is a monorepo with a separate Express backend and Angular frontend. The root `package.json` only orchestrates them via `concurrently`.

### Backend (`salesflow-backend/src/`)

**MVC + Service layer pattern:**
- `routes/` → `controllers/` → `services/` → `models/`
- `validators/` — Joi schemas validated by `middleware/validate.middleware.js`
- `utils/` — quarter calculations, pagination, response formatting
- `config/` — MongoDB connection (`db.js`) and JWT helpers (`jwt.js`)

All API routes are mounted under `/api/v1`. Auth uses JWTs stored in both httpOnly cookies and `Authorization: Bearer` headers — the middleware checks both.

**Key business logic files:**
- `services/commission.service.js` (27KB) — role-based, achievement-slab commission calculation
- `utils/quarter.utils.js` — working-day calculations powering quarterly targets
- `services/target.service.js` — adjusted target recalculation on team transfers

**Data patterns:**
- Soft deletes via `isActive` flag (never hard-delete employees or clients)
- Denormalized `employeeName`/`clientName` in Sale documents for query performance
- `quarterId` format: `"Q1-2026"`, `"Q2-2026"`, etc.

**Core entities:** User (admin) → Employee → Team (via EmployeeTeamHistory) → Sale (1-4 sellers, shares sum to 100%) → Claim → CommissionPayout → QuarterlySettlement / QuarterlyTarget

**Sale status flow:** `draft` → `confirmed` → `claimed` → `collected`

### Frontend (`salesflow-frontend/src/app/`)

**Angular 20 standalone components, feature-based folder structure:**
- `core/` — guards (`auth`, `guest`), interceptors (`auth`, `error`), shared services, models
- `features/` — 12 lazy-loaded feature modules (employees, teams, sales, clients, claims, commissions, dashboard, targets, audits, settings, auth)
- `layout/` — main layout + auth layout shell components
- `shared/` — reusable components (navbar, sidebar, pagination, modals, badges, avatar-upload) and the `currency-egp` pipe

**State management:** Angular signals + services + RxJS. Services cache API responses in signals; `computed()` signals derive UI state (e.g., `isAuthenticated`). No NgRx.

**HTTP:** Two functional interceptors registered in `app.config.ts`:
- `authInterceptor` — attaches `Bearer` token from localStorage
- `errorInterceptor` — clears auth state and redirects on 401

Dev proxy (`proxy.conf.json`) forwards all `/api/v1` requests to `localhost:3000`.

**i18n:** `@ngx-translate` with Arabic (`ar-EG`) / English toggle, persisted in `localStorage`.

**UI:** Tailwind CSS with a custom design system defined in `tailwind.config.js`:
- CSS custom property-based color tokens (`--sf-bg`, `--sf-primary`, etc.)
- Glassmorphism surfaces, neon glow utilities (purple, cyan, pink, green)
- Status badge colors: `draft` / `confirmed` / `claimed` / `collected`
- Fonts: Cairo (display), DM Sans (body), JetBrains Mono (code)
- Path aliases: `@core/*`, `@shared/*`, `@features/*`, `@env/*`

## Commission Business Rules

Documented in `commission_rules.txt` and `salesflow-backend/README.md`. Key points:
- Roles: Fresh → BA → BC → Senior → SV → TeamLeader
- Commission is achievement-slab-based within each role
- Personal-source vs. company-source sales use different rate tables
- Taxes: VAT 14%, withholding tax 5%
- Quarterly targets are adjusted for actual working days in a quarter, recalculated when employees transfer teams
