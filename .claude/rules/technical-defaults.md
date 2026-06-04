---
description: Tech stack defaults and library preferences for SalesFlow
---

# Technical Defaults

## Frontend stack (Angular 20)
- Always use standalone components (`standalone: true`)
- Always use `ChangeDetectionStrategy.OnPush`
- State via Angular signals — NO NgRx, NO BehaviorSubject for simple state
- `computed()` for any derived value
- `effect()` only when side effects are truly needed
- Async: `toSignal()` to bridge RxJS → signals where possible
- No `any` types — use proper interfaces from `core/models/`

## HTTP calls
- Use service-layer methods only — never call `HttpClient` directly in components
- Services cache responses in signals; components read from signals
- Auth token attached automatically by `authInterceptor`

## Styling
- Tailwind utility classes only — no raw CSS unless custom property token
- Use existing design tokens: `sf-bg`, `sf-primary`, `sf-muted`, `sf-text`, `sf-border`
- Glassmorphism: `glass-card` class pattern
- Glow utilities: `glow-purple`, `glow-cyan`, `glow-pink`, `glow-green`
- RTL-compatible: use `start/end` over `left/right` in flex/margin

## Backend stack (Express + Mongoose)
- All routes require `auth` middleware unless explicitly public
- Validation: Joi schema in `validators/` — never inline validation
- Services: business logic only — no HTTP concerns
- Models: Mongoose schemas — all business-significant fields must have types + required flags
- Use `populate()` sparingly — prefer denormalized `employeeName`/`clientName` pattern
- Pagination: use shared `paginate()` util from `utils/`
- Responses: use shared response formatter from `utils/`

## File naming
- Frontend: `kebab-case.component.ts` / `.html` / `.css`
- Backend: `kebab-case.service.js` / `.controller.js` / `.routes.js`
- Never create a new file if an existing one can be extended

## Dependencies
- Frontend: check `package.json` before proposing a new npm package
- Backend: prefer built-in Node.js or already-installed packages first
- Never install a package just for a one-liner that can be written inline
