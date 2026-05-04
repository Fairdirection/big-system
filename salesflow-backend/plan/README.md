# 🏢 SalesFlow — Sales Commission & Collection Management System
## Complete AI Vibe Coding Guide

> This folder contains everything an AI needs to build the full SalesFlow system from scratch.
> Read ALL files before writing any code.

---

## 📁 File Map — Read in This Order

```
salesflow-planning/
│
├── README.md                          ← START HERE (you are here)
│
├── docs/
│   ├── 01-business-rules.md           ← Core logic, formulas, constraints
│   ├── 02-user-stories.md             ← What each screen must do
│   ├── 03-data-flow.md                ← How data moves through the system
│   └── 04-ui-screens.md               ← Every screen described in detail
│
├── database/
│   ├── schemas.md                     ← All MongoDB collections + fields
│   └── seed-data.md                   ← Sample data for testing
│
├── api/
│   └── endpoints.md                   ← All REST API routes + req/res examples
│
├── backend/
│   ├── folder-structure.md            ← Express.js folder tree
│   ├── backend-rules.md               ← Coding conventions for backend
│   └── calculated-fields.md          ← All auto-calculated fields logic
│
├── frontend/
│   ├── folder-structure.md            ← Angular folder tree
│   ├── frontend-rules.md              ← Coding conventions for frontend
│   └── components-map.md             ← Every Angular component described
│
└── phases/
    └── build-phases.md                ← Step-by-step what to build first
```

---

## 🧠 System Summary (Read This First)

**SalesFlow** is an internal web app for a **real estate brokerage company**.
It is used only by the **Treasury Manager / Accounts Manager** (single admin role).

### What the system does:
1. Manages sales employees — tracks targets, teams, transfers
2. Manages real estate developer clients
3. Records property sales with full commission calculation
4. Distributes commissions automatically among sellers
5. Generates collection claims against developers
6. Tracks quarterly target achievement per employee and team

---

## ⚙️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Angular | 17+ (standalone components) |
| Backend | Express.js | 4.x (Node.js 20+) |
| Database | MongoDB | 7+ (Mongoose ODM) |
| Auth | JWT | jsonwebtoken library |
| Validation | Joi | backend request validation |
| Password | bcrypt | password hashing |
| HTTP Client | Angular HttpClient | built-in |
| UI Library | Angular Material | or PrimeNG |
| API Style | REST | JSON responses |

---

## 🔑 Key Concepts — Understand Before Coding

### 1. Quarter System
```
Q1 = January, February, March     (months 1-3)
Q2 = April, May, June             (months 4-6)
Q3 = July, August, September      (months 7-9)
Q4 = October, November, December  (months 10-12)

Quarter ID format: "Q2-2026"
IMPORTANT: No other quarter definitions exist in this system.
```

### 2. Target Calculation
```
Adjusted Target = (Full Target ÷ 90) × Actual Working Days in Quarter

Working Days = days between:
  - MAX(quarter start date, employee hire date, team join date)
  - MIN(quarter end date, employee end date, team leave date)
```

### 3. Commission Chain
```
Collected Commission % = Contract Commission % × Developer Collection %

Gross Commission (with VAT) = Collected Commission % × Unit Value (contract price)

Net Revenue                  = Gross Commission ÷ 1.14
VAT (14%)                   = Net Revenue × 0.14
Withholding Tax (5%)        = Net Revenue × 0.05
Invoice Amount              = Net Revenue + VAT - Withholding Tax
```

### 4. Seller Split Rule
```
Each sale can have 1 to 4 sellers.
Each seller gets a share percentage.
ALL share percentages MUST sum to exactly 100%.
Commission per seller = share% × Gross Commission (with VAT)
```

### 5. Hierarchical Targets
```
Sales Employee  → has individual target (manual input)
Team Leader     → target = SUM of all members' targets
Sales Manager   → target = SUM of all team leaders' targets
```

### 6. Employee Transfer Rule
```
- A sales employee belongs to exactly ONE team at a time
- When transferred: record leaveDate on old history, create new history record
- Working days per team per quarter are tracked separately
- If team leader resigns: members must be reassigned to other teams
```

---

## 🚫 Hard Constraints (Never Violate)

- [ ] Sale cannot be confirmed if seller shares don't sum to 100%
- [ ] Only Q1/Q2/Q3/Q4 quarters are valid — no custom quarters
- [ ] Employee code, client code, sale number, claim number are ALL auto-generated
- [ ] Target and team fields only appear for Sales department employees
- [ ] "Private" sale source hides the client registration date field
- [ ] Soft delete only — never hard delete records
- [ ] Single role system — no permissions logic needed currently
- [ ] Team name = Team Leader's name (auto-set, not manually entered)

---

## 🌐 Base URL Convention
```
Backend runs on:   http://localhost:3000
Frontend runs on:  http://localhost:4200
API prefix:        /api/v1
```
