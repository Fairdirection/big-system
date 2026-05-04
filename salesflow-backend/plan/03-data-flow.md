# 🔄 Data Flow — SalesFlow

> How data moves through the system from input to output.

---

## 1. Employee Creation Flow

```
Manager fills form
        │
        ▼
Frontend validates required fields
        │
        ├── dept = Sales?
        │     YES → validate target, team, seniority
        │     NO  → skip those fields
        │
        ▼
POST /api/v1/employees
        │
        ▼
Backend:
  1. Validate nationalId uniqueness
  2. Validate email uniqueness
  3. Generate code: EMP-XXXX (find max code, increment)
  4. Calculate totalWorkingDays = today - hireDate
  5. Calculate currentQuarterWorkingDays (see formula in business-rules.md)
  6. If dept=Sales AND currentTeamId provided:
       → Create employee_team_history record
       → { employeeId, teamId, joinDate=teamJoinDate, leaveDate=null }
       → Add employee._id to team.memberIds
  7. Save employee to DB
        │
        ▼
Response: { success: true, data: { employee with code } }
        │
        ▼
Frontend: shows employee profile with read-only code
```

---

## 2. Team Transfer Flow

```
Manager selects employee → clicks "Transfer Team"
        │
        ▼
Modal: select new team + transfer date
        │
        ▼
PATCH /api/v1/employees/:id/transfer-team
{ newTeamId, transferDate }
        │
        ▼
Backend:
  1. Find current active history record (leaveDate = null)
  2. Set leaveDate = transferDate on old record
  3. Calculate workingDaysInTeam for old record
  4. Create new history record { employeeId, newTeamId, joinDate=transferDate }
  5. Update employee.currentTeamId = newTeamId
  6. Update employee.teamJoinDate = transferDate
  7. Remove employeeId from old team.memberIds
  8. Add employeeId to new team.memberIds
  9. Recalculate employee.currentQuarterWorkingDays
        │
        ▼
Response: { success: true, data: { transfer summary } }
```

---

## 3. Sale Creation & Commission Calculation Flow

```
Manager fills sale form
        │
        ▼
REAL-TIME (frontend calculates on every input change):
  collectedCommissionPercentage = contractCommissionPercentage × (developerCollectionPercentage/100)
  grossCommissionWithVAT        = (collectedCommissionPercentage/100) × unitValue
  netRevenue                    = grossCommissionWithVAT / 1.14
  vat                           = netRevenue × 0.14
  withholdingTax                = netRevenue × 0.05
  invoiceAmount                 = netRevenue + vat - withholdingTax
        │
        ▼
Manager adds sellers (up to 4):
  → Enter seller + sharePercentage
  → Frontend shows: commissionValue = share% × grossCommissionWithVAT
  → Frontend shows running total of shares
  → RED warning if total ≠ 100%
        │
        ▼
Manager clicks Save (draft):
POST /api/v1/sales
        │
        ▼
Backend:
  1. Validate all required fields
  2. Validate sellers.sharePercentage sums to 100 (or allow draft without validation)
  3. Auto-generate saleNumber: SALE-XXXX
  4. Calculate all commission fields (server-side, don't trust frontend)
  5. Detect quarterId from contractDate
  6. Denormalize clientName from clients collection
  7. Denormalize employeeName for each seller
  8. Save sale with status = "draft"
        │
        ▼
Manager clicks "Confirm Sale":
POST /api/v1/sales/:id/confirm
        │
        ▼
Backend:
  1. Verify sellers sum = exactly 100 → reject if not
  2. Change status = "confirmed"
  3. Sale is now locked (no further edits)
  4. Target achievement for each seller is updated
```

---

## 4. Target Calculation Flow

```
GET /api/v1/targets/employee/:id?quarterId=Q2-2026
        │
        ▼
Backend:
  1. Get employee.target (full target)
  2. Get quarter bounds (start/end dates)
  3. Query employee_team_history where:
       employeeId = :id AND quarterId = Q2-2026
  4. For each history record:
       recordStart = MAX(quarterStart, record.joinDate)
       recordEnd   = MIN(quarterEnd, record.leaveDate OR today)
       days        = recordEnd - recordStart (in days)
  5. totalDays = SUM of all record days
  6. adjustedTarget = (fullTarget / 90) × totalDays
  7. Query sales where:
       quarterId = Q2-2026 AND
       sellers contains { employeeId: :id } AND
       status IN ['confirmed', 'claimed', 'collected']
  8. achieved = SUM of seller.commissionValue for this employee across those sales
  9. achievementPercent = (achieved / adjustedTarget) × 100
  10. gap = adjustedTarget - achieved
        │
        ▼
Response: { adjustedTarget, achieved, achievementPercent, gap, workingDays }
```

---

## 5. Claim Creation Flow

```
Manager views a confirmed sale → clicks "Create Claim"
        │
        ▼
POST /api/v1/claims
{ saleId: "64sale001..." }
        │
        ▼
Backend:
  1. Verify sale.status = "confirmed" (or "claimed" not already)
  2. Check no existing claim for this saleId
  3. Auto-generate claimNumber: CLM-XXXX
  4. Denormalize from sale: saleNumber, projectName, unitNumber, clientName
  5. Copy: commissionDue = sale.grossCommissionWithVAT
  6. Copy: invoiceStatus, expectedCollectionDate
  7. Save claim with status = "pending"
  8. Update sale.status = "claimed"
        │
        ▼
Response: { claim details }
```

---

## 6. Settings → Sale Source Flow

```
POST /api/v1/settings
{ type: "saleSource", value: "Exhibition", label: "Exhibition", isDefault: false }
        │
        ▼
Backend saves to settings collection
        │
        ▼
GET /api/v1/settings/saleSource
→ Returns all active sale sources
→ Frontend populates dropdown in sale form
        │
        ▼
Special case: if value = "Private"
  Frontend: hides clientRegistrationDate field
  Backend: sets isPrivateSource = true on sale
```

---

## 7. Data Relationships Summary

```
settings ←────────────────────────────────────────────────┐
   (sale sources, invoice types)                          │
                                                          │
employees ───────────────┐                                │
   │ currentTeamId       │                                │
   ▼                     │                                │
teams ◄──────────────────┘                                │
   │ (memberIds, teamLeaderId)                            │
   │                                                      │
employee_team_history                                     │
   (employeeId, teamId, joinDate, leaveDate)              │
                                                          │
clients                                                   │
   │                                                      │
   ▼                                                      │
sales ◄───────────────────────────────────────────────────┘
   │ (source → settings)
   │ (clientId → clients)
   │ (sellers[].employeeId → employees)
   │
   ▼
claims
   (saleId → sales)
```
