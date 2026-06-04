---
name: print-report
description: Adds a print button and printable report to a SalesFlow feature component. Use when adding print functionality to a new page.
tools:
  - Read
  - Edit
  - Glob
  - Grep
---

# Skill: Add Print Report to Component

## Purpose
Add a print button and `printXxx()` method to a SalesFlow Angular feature component following the established print pattern.

## Prerequisites
Read `salesflow-frontend/src/app/core/utils/print.utils.ts` to understand available exports:
- `openPrintWindow(title)` — opens print window, returns `win`
- `printBanner(win, title, subtitle?)` — renders header
- `printFooter(win)` — renders footer with FairDirection branding
- `printFmt(value, type)` — formats numbers/dates for print
- `statusPill(status)` — returns colored HTML span for status badge

## Steps

### Step 1: Add imports to the component TypeScript file
```typescript
import { heroPrinter } from '@ng-icons/heroicons/outline';
import { NgIconsModule } from '@ng-icons/core';
// Add to provideIcons():
provideIcons({ heroPrinter, ...existingIcons })
```

### Step 2: Add print button to the template
Place next to the refresh button in the filter/header bar:
```html
<button
  (click)="printXxx()"
  class="p-2 hover:bg-sf-primary/10 rounded-xl text-sf-muted hover:text-sf-primary transition-all"
  title="طباعة">
  <ng-icon name="heroPrinter" class="w-5 h-5"></ng-icon>
</button>
```

### Step 3: Write the print method
```typescript
printXxx(): void {
  const d = this.data(); // or whatever signal holds the data
  if (!d) return;

  const win = openPrintWindow('Report Title');

  // Banner
  win.document.write(printBanner(win, 'Report Title', 'Subtitle or date range'));

  // Stats row (KPI cards)
  win.document.write(`
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">
      ${[
        { label: 'Label 1', value: printFmt(d.field1, 'currency') },
        { label: 'Label 2', value: printFmt(d.field2, 'number') },
      ].map(s => `
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">${s.label}</div>
          <div style="font-size:20px;font-weight:700;color:#7c3aed;margin-top:4px;">${s.value}</div>
        </div>
      `).join('')}
    </div>
  `);

  // Data table
  win.document.write(`
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:8px 12px;text-align:left;border:1px solid #e5e7eb;">Column 1</th>
          <th style="padding:8px 12px;text-align:right;border:1px solid #e5e7eb;">Column 2</th>
        </tr>
      </thead>
      <tbody>
        ${(d.items || []).map((item: any) => `
          <tr>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;">${item.field1}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right;">${printFmt(item.field2, 'currency')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `);

  // Footer
  win.document.write(printFooter(win));

  setTimeout(() => {
    win.print();
    win.close();
  }, 650);
}
```

### Step 4: Verify
- TypeScript typecheck passes: `npx tsc --noEmit`
- Print button visible in header
- Print dialog opens when button is clicked
- All data fields render correctly in print preview

## Notes
- `printFmt(value, 'currency')` uses `CurrencyEgpPipe` format for Arabic locale
- Always use 650ms timeout before `win.print()` to allow Cairo font to load
- Keep stat cards to max 4 per row in print layout
