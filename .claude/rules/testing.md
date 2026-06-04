---
description: Testing rules and verification requirements for SalesFlow
---

# Testing Rules

## Minimum verification bar
- Every frontend change: run `npx tsc --noEmit` — zero errors required
- Every backend route change: mentally trace the full request path
- Commission calculation changes: verify against at least two role-slab examples from `commission_rules.txt`

## TypeScript typecheck
```
cd salesflow-frontend && npx tsc --noEmit
```
- Fix ALL errors — never ignore or suppress with `// @ts-ignore` unless you explain why
- No implicit `any` — type every function parameter and return value
- Interface changes in `core/models/` must be propagated to all usages

## Angular component checklist
After creating or modifying a component:
- [ ] `standalone: true` declared
- [ ] `ChangeDetectionStrategy.OnPush` set
- [ ] All `@Input()` signals typed properly
- [ ] No `any` types
- [ ] `provideIcons()` includes all used icons
- [ ] `imports` array includes all used directives/pipes/components
- [ ] Template binding syntax correct (`[prop]`, `(event)`, `[(ngModel)]`)

## Backend route checklist
After adding or modifying a route:
- [ ] Auth middleware applied (or explicitly noted as public)
- [ ] Joi validator applied to request body/params
- [ ] Service method handles DB errors
- [ ] Response uses shared formatter
- [ ] Pagination uses shared util if returning lists

## Commission logic verification
When `commission.service.js` changes:
1. Identify which role + achievement bracket is affected
2. Calculate expected result manually from `commission_rules.txt`
3. Confirm the service produces the same result
4. Check edge cases: exactly at slab boundary, 0% achievement, 200%+ achievement

## Test files location
- Frontend unit tests: `*.spec.ts` alongside the component
- Run: `npm test` in `salesflow-frontend/`
- Don't create tests for trivial getters/setters — test business logic and edge cases
