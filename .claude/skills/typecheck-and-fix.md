---
name: typecheck-and-fix
description: Runs TypeScript typecheck on the frontend and automatically fixes all errors. Use after any frontend change to ensure zero type errors.
tools:
  - Bash
  - Read
  - Edit
  - Glob
  - Grep
---

# Skill: TypeCheck and Fix

## Purpose
Run `npx tsc --noEmit` on the Angular frontend, read all errors, fix them, and re-run until clean.

## Steps

1. **Run typecheck**
   ```bash
   cd salesflow-frontend && npx tsc --noEmit 2>&1
   ```

2. **If output is empty** → report "TypeCheck: PASS — zero errors" and stop.

3. **If there are errors**:
   - Parse every error: `file(line,col): error TSxxxx: message`
   - Group errors by file
   - For each file, read the relevant section and apply the fix
   - Common fixes:
     - `Property 'x' does not exist` → check if property name changed, use correct name
     - `Type 'X' is not assignable to 'Y'` → fix the type or cast appropriately
     - `Object is possibly 'null'` → add null check or use optional chaining `?.`
     - `Cannot find module '@core/...'` → check tsconfig path aliases
     - Missing import → add to `imports: []` in component decorator

4. **Re-run typecheck** after fixes.

5. **Repeat** until `npx tsc --noEmit` produces no output.

6. **Report**: number of errors fixed, files modified.

## Rules
- Never use `// @ts-ignore` or `as any` to suppress errors — fix the root cause
- If an error requires a business logic decision, pause and ask the user
- Fix one file at a time, re-check after each file
