---
description: Development workflow rules for SalesFlow monorepo
---

# Workflow Rules

## Before any frontend change
1. Read the target component file first
2. Make the change
3. Run `npx tsc --noEmit` in `salesflow-frontend/` — fix ALL errors before stopping
4. If UI change: describe what to test in the browser (golden path + edge cases)

## Before any backend change
1. Identify which route/controller/service/model is affected
2. Check if a validator (`validators/`) needs updating
3. Test the endpoint mentally against existing data patterns

## Task → Do → Verify loop (always)
- Every build task must have a verification step
- Never declare a task done without verifying the result
- For code: typecheck is the minimum verification bar
- For UI: describe the visual test needed

## Parallel work
- Use git branches for parallel feature work
- Never modify `commission.service.js` and another service in the same commit
- Keep commits focused: one logical change per commit

## Context hygiene
- After switching tasks: recap what changed and what's next
- When context grows large: summarize state before continuing
- Move repeated task instructions to a skill file rather than re-stating each session

## Git commit style
- Format: `type: short description` (feat/fix/refactor/docs/chore)
- No trailing period
- Past tense or imperative are both fine
- Co-author line required when Claude Code assists
