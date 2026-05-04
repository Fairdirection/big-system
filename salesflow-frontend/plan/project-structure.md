# 📄 project-structure.md
# SalesFlow Frontend — Project Structure

## Full Folder Tree

```
salesflow-frontend/
├── src/
│   ├── app/
│   │   │
│   │   ├── core/                          # Singleton services, guards, interceptors
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts    # Attaches JWT token to every request
│   │   │   │   └── error.interceptor.ts   # Global HTTP error handling
│   │   │   ├── models/                    # TypeScript interfaces matching backend models
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── employee.model.ts
│   │   │   │   ├── sale.model.ts
│   │   │   │   ├── claim.model.ts
│   │   │   │   ├── client.model.ts
│   │   │   │   ├── team.model.ts
│   │   │   │   ├── target.model.ts
│   │   │   │   ├── dashboard.model.ts
│   │   │   │   └── api-response.model.ts
│   │   │   └── services/
│   │   │       ├── auth.service.ts
│   │   │       ├── employee.service.ts
│   │   │       ├── sale.service.ts
│   │   │       ├── claim.service.ts
│   │   │       ├── client.service.ts
│   │   │       ├── team.service.ts
│   │   │       ├── target.service.ts
│   │   │       ├── dashboard.service.ts
│   │   │       └── setting.service.ts
│   │   │
│   │   ├── shared/                        # Reusable UI components, pipes, directives
│   │   │   ├── components/
│   │   │   │   ├── navbar/
│   │   │   │   ├── sidebar/
│   │   │   │   ├── button/
│   │   │   │   ├── card/
│   │   │   │   ├── input/
│   │   │   │   ├── badge/
│   │   │   │   ├── modal/
│   │   │   │   ├── table/
│   │   │   │   ├── stat-card/
│   │   │   │   ├── empty-state/
│   │   │   │   └── loading-spinner/
│   │   │   ├── pipes/
│   │   │   │   ├── currency-egp.pipe.ts   # Format EGP values (matches backend EGP fields)
│   │   │   │   └── quarter-label.pipe.ts  # e.g. "Q2-2026" → "Q2 2026"
│   │   │   └── directives/
│   │   │       └── click-outside.directive.ts
│   │   │
│   │   ├── features/                      # Feature modules (lazy-loaded)
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   └── change-password/
│   │   │   ├── dashboard/
│   │   │   │   └── dashboard.component.ts
│   │   │   ├── employees/
│   │   │   │   ├── employee-list/
│   │   │   │   ├── employee-detail/
│   │   │   │   └── employee-form/
│   │   │   ├── sales/
│   │   │   │   ├── sale-list/
│   │   │   │   ├── sale-detail/
│   │   │   │   ├── sale-form/
│   │   │   │   └── commission-preview/
│   │   │   ├── claims/
│   │   │   │   ├── claim-list/
│   │   │   │   └── claim-form/
│   │   │   ├── clients/
│   │   │   │   ├── client-list/
│   │   │   │   └── client-form/
│   │   │   ├── teams/
│   │   │   │   ├── team-list/
│   │   │   │   └── team-form/
│   │   │   ├── targets/
│   │   │   │   └── target-list/
│   │   │   └── settings/
│   │   │       └── settings.component.ts
│   │   │
│   │   ├── layout/                        # Shell layout components
│   │   │   ├── main-layout/
│   │   │   │   └── main-layout.component.ts
│   │   │   └── auth-layout/
│   │   │       └── auth-layout.component.ts
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.config.ts                  # provideRouter, provideHttpClient, etc.
│   │   └── app.routes.ts
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   │
│   └── styles.css
│
├── proxy.conf.json
├── tailwind.config.js
├── postcss.config.js
├── angular.json
├── tsconfig.json
└── package.json
```

---

## `/core` — Application Backbone

The `core/` folder contains **singleton providers** bootstrapped once at app startup. Nothing here is rendered directly.

**Services** map 1:1 to backend routes:

| Service | Backend Route |
|---|---|
| `auth.service.ts` | `/api/v1/auth` |
| `employee.service.ts` | `/api/v1/employees` |
| `sale.service.ts` | `/api/v1/sales` |
| `claim.service.ts` | `/api/v1/claims` |
| `client.service.ts` | `/api/v1/clients` |
| `team.service.ts` | `/api/v1/teams` |
| `target.service.ts` | `/api/v1/targets` |
| `dashboard.service.ts` | `/api/v1/dashboard` |
| `setting.service.ts` | `/api/v1/settings` |

**Interceptors:**
- `auth.interceptor.ts` — reads JWT from `localStorage`, injects `Authorization: Bearer <token>` header on every request (mirrors backend `authMiddleware` which checks both `Authorization` header and cookies)
- `error.interceptor.ts` — catches 401 → redirects to `/auth/login`; catches 4xx/5xx → surfaces toast notifications

**Guards:**
- `auth.guard.ts` — protects all routes behind `/dashboard`; redirects to `/login` if no valid token

**Models** — TypeScript interfaces that mirror every Mongoose schema field, ensuring type safety:

```ts
// Example: core/models/sale.model.ts mirrors sale.model.js exactly
export interface Seller {
  employeeId: string;
  employeeName: string;
  sharePercentage: number;
  commissionValue: number;
  isManualOverride: boolean;
}

export type SaleStatus = 'draft' | 'confirmed' | 'claimed' | 'collected';
```

---

## `/shared` — Reusable UI System

Contains **dumb/presentational components** with no business logic. Each is a standalone Angular component with Tailwind classes only.

Best practices:
- Always use `ChangeDetectionStrategy.OnPush`
- Accept data via `@Input()`, emit events via `@Output()`
- No direct service injection — data flows down, events flow up

---

## `/features` — Business Feature Modules

Each sub-folder maps to a backend resource and lazy-loads as a separate route chunk.

Best practices:
- One folder per backend resource (matches backend `/routes/*.routes.js`)
- Feature components **may** inject core services directly
- Forms use Angular Reactive Forms — mirrors backend validators (e.g., `sale.validator.js` → `sale-form.component.ts`)
- Smart/container components own service calls; dumb sub-components handle display only

---

## `/layout` — Shell Wrappers

- `main-layout` — authenticated shell with sidebar + navbar; wraps all protected feature routes
- `auth-layout` — centered card layout; wraps login and change-password pages

---

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Component | `kebab-case/` folder + `feature.component.ts` | `sale-form.component.ts` |
| Service | `resource.service.ts` | `sale.service.ts` |
| Model | `resource.model.ts` | `sale.model.ts` |
| Pipe | `name.pipe.ts` | `currency-egp.pipe.ts` |
| Guard | `name.guard.ts` | `auth.guard.ts` |
