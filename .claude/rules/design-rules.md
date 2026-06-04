---
description: UI/UX design conventions for the SalesFlow interface
---

# Design Rules

## Brand
- Name: **FairDirection** — never "fair direction", never two words, never Arabic transliteration
- Primary color: purple (`--sf-primary`) — all key actions, active states, highlights

## Card pattern (KPI/stat cards)
- Structure: container → top row (label + icon) → number row
- Top row: `flex items-center justify-between` — label left, icon right with `shrink-0`
- Icon container: `w-9 h-9 rounded-xl bg-sf-primary/10 flex items-center justify-center text-sf-primary shrink-0`
- Number: `font-display font-black text-sf-text break-words leading-snug`
- For monetary values: `style="font-size: clamp(0.95rem, 2.5vw, 1.5rem)"` — never fixed `text-2xl`/`text-3xl` for currency
- For short values (%, counts): `text-2xl` is fine

## Typography
- Display/headings: Cairo font (`font-display`)
- Body: DM Sans (`font-body`)
- Code/numbers: JetBrains Mono (`font-mono`)
- Arabic text inherits Cairo automatically via i18n locale

## Layout
- Page containers: `p-6` or `p-8` padding
- Section spacing: `space-y-6` or `mb-8`
- Cards: `glass-card p-5 rounded-3xl border border-sf-border shadow-xl`
- Grids: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4` for stat cards

## Status badges
Colors are defined in Tailwind config — use only the semantic class names:
- `draft` → gray
- `confirmed` → blue
- `claimed` → yellow/amber
- `collected` → green

## Tables
- Wrapper: `overflow-x-auto` to handle narrow viewports
- Header: `text-xs uppercase tracking-wider text-sf-muted`
- Rows: `hover:bg-sf-primary/5 transition-colors`
- Numbers in tables: right-align currency columns

## Animations
- Transitions: `transition-all duration-200` or `transition-colors`
- Hover effects: slight background tint (`hover:bg-sf-primary/10`)
- Loading states: spinner or skeleton — never blank space

## Icons
- Library: `@ng-icons/heroicons/outline` for all icons
- Register via `provideIcons()` in component `imports`
- Print icon: `heroPrinter`
- Never use emoji as icons in the UI

## Print layout
- All print output uses the shared `print.utils.ts` — never custom print CSS inline
- `openPrintWindow` → `printBanner` → content → `printFooter`
- Tables in print: `border-collapse: collapse`, `1px solid #ddd` borders
