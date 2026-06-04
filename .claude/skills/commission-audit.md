---
name: commission-audit
description: Audits a commission calculation for a specific employee and quarter. Verifies the service output matches the business rules in commission_rules.txt. Use when commission numbers seem incorrect.
tools:
  - Read
  - Bash
  - Grep
---

# Skill: Commission Audit

## Purpose
Manually trace a commission calculation for an employee and verify it matches the business rules.

## Inputs required (ask user if not provided)
- Employee ID or name
- Quarter ID (format: "Q1-2026")
- Employee role at the start of the quarter

## Steps

### Step 1: Read the business rules
Read `commission_rules.txt` and `salesflow-backend/README.md`.
Extract:
- Rate table for the employee's role
- Personal-source vs company-source rates
- Slab boundaries (achievement percentage → commission rate)
- Tax rates: VAT 14%, withholding 5%

### Step 2: Get the employee's data
Query the database or ask the user to provide:
- Adjusted quarterly target (after working-day adjustment)
- Total confirmed sales value (achieved amount)
- Sales breakdown: personal-source vs company-source amounts
- Achievement percentage = (achieved / target) × 100

### Step 3: Calculate expected commission manually
For each slab that applies:
1. Determine which achievement bracket this falls into
2. Apply the correct rate for personal-source portion
3. Apply the correct rate for company-source portion
4. Sum up gross commission
5. Deduct VAT (14%) → net commission
6. Deduct withholding tax (5%) → final payout

### Step 4: Compare with system output
Read `salesflow-backend/src/services/commission.service.js` for the relevant calculation path.
Check if the system's output matches the manual calculation.

### Step 5: Report findings
```
## Commission Audit Report
Employee: [name]
Quarter: [Q#-YYYY]
Role: [role]

Target: [amount]
Achieved: [amount]
Achievement: [%]

Expected Commission (manual): [amount]
System Commission (output): [amount]
Match: YES / NO

[If NO: describe the discrepancy and which line in commission.service.js is suspect]
```

## Notes
- The `slab` terminology: achievement % determines which tier of the rate table applies
- Some roles have different tables for "personal" vs "company" sourced sales
- Quarterly targets are adjusted for working days — use `adjustedTarget` not raw `target`
