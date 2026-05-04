# 🧮 Calculated Fields — SalesFlow

> Every field that is auto-calculated. Never let the frontend dictate these values.
> Always recalculate on the backend before saving.

---

## Employee Calculated Fields

### `code` (String)
```
Trigger: on POST /employees
Formula: "EMP-" + zero-padded incrementing number
Example: EMP-0001, EMP-0042
Source:  code-generator.js
```

### `totalWorkingDays` (Number)
```
Trigger: on create, on endDate update
Formula: (endDate ?? today) - hireDate   → in days
Example: hired 2024-01-01, today 2026-04-26 → 846 days
```

### `currentQuarterWorkingDays` (Number)
```
Trigger: on create, on transfer, at quarter boundary
Formula: sum across all employee_team_history records for current quarter:
         for each record:
           effectiveStart = MAX(quarterStart, record.joinDate)
           effectiveEnd   = MIN(quarterEnd, record.leaveDate ?? today)
           days = effectiveEnd - effectiveStart (if positive, else 0)
         total = sum of all days
```

---

## Team Calculated Fields

### `name` (String)
```
Trigger: on team create, on teamLeaderId change
Formula: teams.name = employees.find(teamLeaderId).name
Never manually set by user.
```

---

## Sale Calculated Fields

### `saleNumber` (String)
```
Trigger: on POST /sales
Formula: "SALE-" + zero-padded incrementing number
Example: SALE-0001, SALE-0124
```

### `isPrivateSource` (Boolean)
```
Trigger: on create/update when source changes
Formula: source === "Private" ? true : false
Effect: if true → clientRegistrationDate is not required/shown
```

### `collectedCommissionPercentage` (Number, 2 decimals)
```
Trigger: any change to contractCommissionPercentage or developerCollectionPercentage
Formula: contractCommissionPercentage × (developerCollectionPercentage / 100)
Example: 2.5% × 50% = 1.25%
```

### `grossCommissionWithVAT` (Number, 2 decimals)
```
Trigger: any change to collectedCommissionPercentage or unitValue
Formula: (collectedCommissionPercentage / 100) × unitValue
Example: 1.25% × 5,000,000 = 62,500 EGP
Note: This is the total commission INCLUDING VAT (14% already baked in)
```

### `netRevenue` (Number, 2 decimals)
```
Trigger: change to grossCommissionWithVAT
Formula: grossCommissionWithVAT / 1.14
Example: 62,500 / 1.14 = 54,824.56 EGP
```

### `vat` (Number, 2 decimals)
```
Trigger: change to netRevenue
Formula: netRevenue × 0.14
Example: 54,824.56 × 0.14 = 7,675.44 EGP
Verification: vat + netRevenue should equal grossCommissionWithVAT (within rounding)
```

### `withholdingTax` (Number, 2 decimals)
```
Trigger: change to netRevenue
Formula: netRevenue × 0.05
Example: 54,824.56 × 0.05 = 2,741.23 EGP
```

### `invoiceAmount` (Number, 2 decimals)
```
Trigger: change to netRevenue, vat, or withholdingTax
Formula: netRevenue + vat - withholdingTax
Example: 54,824.56 + 7,675.44 - 2,741.23 = 59,758.77 EGP
Simplified: grossCommissionWithVAT - withholdingTax
```

### `sellers[].commissionValue` (Number, 2 decimals)
```
Trigger: change to sharePercentage or grossCommissionWithVAT
Formula: (sharePercentage / 100) × grossCommissionWithVAT
Example: 60% × 62,500 = 37,500 EGP
```

### `quarterId` (String)
```
Trigger: on create or contractDate change
Formula: getQuarterId(contractDate)
Example: contractDate = 2026-04-15 → "Q2-2026"
```

---

## Client Calculated Fields

### `code` (String)
```
Trigger: on POST /clients
Formula: "CLT-" + zero-padded incrementing number
Example: CLT-0001, CLT-0020
```

---

## Claim Calculated Fields

### `claimNumber` (String)
```
Trigger: on POST /claims
Formula: "CLM-" + zero-padded incrementing number
Example: CLM-0001, CLM-0015
```

### `commissionDue` (Number)
```
Trigger: on create (copied from sale)
Formula: = sale.grossCommissionWithVAT
Never recalculated after creation (snapshot)
```

---

## Target Calculated Fields (runtime, not stored)

### `adjustedTarget` (Number)
```
Formula: (employee.target / 90) × currentQuarterWorkingDays
Example: (10,000,000 / 90) × 75 = 8,333,333 EGP
```

### `achievedSales` (Number)
```
Formula: SUM of sellers[where employeeId matches].commissionValue
         for all sales where quarterId = requested quarter
         and status IN ['confirmed', 'claimed', 'collected']
```

### `achievementPercentage` (Number, 1 decimal)
```
Formula: (achievedSales / adjustedTarget) × 100
Example: (6,500,000 / 8,333,333) × 100 = 78.0%
```

### `gap` (Number)
```
Formula: adjustedTarget - achievedSales
Negative = exceeded target (good)
Positive = below target (needs attention)
```

---

## Frontend Real-Time Preview

These fields should be calculated in real-time on the frontend (Angular) as the user types,
for a live preview. But the backend ALWAYS recalculates and overwrites before saving.

```typescript
// Angular service: commission-calculator.service.ts
calculateCommission(input: {
  unitValue: number,
  contractCommissionPercentage: number,
  developerCollectionPercentage: number
}) {
  const collected = input.contractCommissionPercentage * (input.developerCollectionPercentage / 100);
  const gross = (collected / 100) * input.unitValue;
  const net = gross / 1.14;
  const vat = net * 0.14;
  const withholding = net * 0.05;
  const invoice = net + vat - withholding;

  return {
    collectedCommissionPercentage: this.round2(collected),
    grossCommissionWithVAT: this.round2(gross),
    netRevenue: this.round2(net),
    vat: this.round2(vat),
    withholdingTax: this.round2(withholding),
    invoiceAmount: this.round2(invoice)
  };
}

private round2(n: number): number {
  return Math.round(n * 100) / 100;
}
```
