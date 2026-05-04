# 👤 User Stories — SalesFlow

> All stories are for the single user role: Treasury Manager / Accounts Manager

---

## Authentication

```
US-001: As a manager, I can log in with email and password to access the system
US-002: As a manager, I can log out to secure my session
US-003: As a manager, I can change my password
US-004: As a manager, I am redirected to login if my session expires
```

---

## Employee Management

```
US-010: As a manager, I can view a list of all employees with search and filter
US-011: As a manager, I can filter employees by department, team, status, seniority
US-012: As a manager, I can view the full profile of a single employee
US-013: As a manager, I can create a new employee with all required fields
US-014: As a manager, I see target/team/seniority fields ONLY when dept = Sales
US-015: As a manager, I can edit an existing employee's details
US-016: As a manager, I can deactivate (soft delete) an employee
US-017: As a manager, I can view an employee's full team transfer history
US-018: As a manager, I can transfer a sales employee to a different team
US-019: As a manager, I can see the employee's current quarter target progress
US-020: As a manager, I see auto-generated employee code (read-only, EMP-XXXX)
US-021: As a manager, I see auto-calculated total working days and quarter working days
```

---

## Team Management

```
US-030: As a manager, I can view all active teams with member count
US-031: As a manager, I can create a new team by selecting a team leader
US-032: As a manager, I see the team name auto-set to the leader's name
US-033: As a manager, I can add members to a team from the sales employee pool
US-034: As a manager, I can view a team's details including all members
US-035: As a manager, I can view a team's target vs achievement for a quarter
US-036: As a manager, I can reassign team members when a leader resigns
US-037: As a manager, I can deactivate a team
```

---

## Client Management

```
US-040: As a manager, I can view all clients (real estate developers)
US-041: As a manager, I can search clients by name or CLT code
US-042: As a manager, I can create a new client (developer)
US-043: As a manager, I can view a client's profile and all their sales
US-044: As a manager, I can edit a client's details
US-045: As a manager, I can deactivate a client
US-046: As a manager, I see the auto-generated CLT-XXXX code (read-only)
```

---

## Sales Management

```
US-050: As a manager, I can view all sales with filters and search
US-051: As a manager, I can filter sales by status, quarter, client, seller, source
US-052: As a manager, I can create a new sale record
US-053: As a manager, I see clientRegistrationDate hidden when source = "Private"
US-054: As a manager, I can select developer collection % from dropdown or enter manually
US-055: As a manager, I see all commission values calculated automatically in real-time
US-056: As a manager, I can add up to 4 sellers with their share percentages
US-057: As a manager, I see a warning if seller shares don't sum to 100%
US-058: As a manager, I cannot confirm a sale if seller shares ≠ 100%
US-059: As a manager, I can preview commission breakdown before saving
US-060: As a manager, I can confirm a sale to lock it
US-061: As a manager, I can edit a draft sale freely
US-062: As a manager, I cannot edit a confirmed sale (only view)
US-063: As a manager, I can view the full details of any sale
US-064: As a manager, I see the auto-generated SALE-XXXX number (read-only)
US-065: As a manager, I can see which quarter a sale belongs to (auto-detected from contractDate)
```

---

## Claims Management

```
US-070: As a manager, I can view all claims with filters
US-071: As a manager, I can create a claim from a confirmed sale
US-072: As a manager, I see claim pre-filled with sale data
US-073: As a manager, I can update a claim's status
US-074: As a manager, I can mark a claim as collected with actual date and amount
US-075: As a manager, I can add notes to a claim
US-076: As a manager, I see the auto-generated CLM-XXXX number (read-only)
```

---

## Target Tracking

```
US-080: As a manager, I can view a target dashboard for any quarter
US-081: As a manager, I can see each employee's: full target, adjusted target, achieved, gap, %
US-082: As a manager, I can see team-level target aggregation
US-083: As a manager, I can filter target view by quarter
US-084: As a manager, I can drill down from team summary to individual members
```

---

## Settings

```
US-090: As a manager, I can view all configurable lookup values
US-091: As a manager, I can add a new sale source
US-092: As a manager, I can edit a sale source name
US-093: As a manager, I can delete a non-default sale source
US-094: As a manager, I can add / edit / delete invoice types
US-095: As a manager, I cannot delete system default settings
```
