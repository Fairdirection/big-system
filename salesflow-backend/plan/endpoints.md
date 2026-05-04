# 🛣️ API Endpoints — SalesFlow (Express.js)

```
Base URL:     /api/v1
Auth:         Bearer JWT token (all routes except POST /auth/login)
Format:       JSON
```

---

## Standard Response Envelope

```javascript
// Success (single)
{ "success": true, "data": { ... } }

// Success (list)
{
  "success": true,
  "data": [...],
  "pagination": { "total": 50, "page": 1, "limit": 20, "totalPages": 3 }
}

// Error
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Email already in use" }]
}
```

---

## AUTH `/api/v1/auth`

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| POST | `/auth/logout` | — | `{ message }` |
| GET | `/auth/me` | — | `{ user }` |
| PATCH | `/auth/change-password` | `{ currentPassword, newPassword }` | `{ message }` |

---

## EMPLOYEES `/api/v1/employees`

| Method | Path | Description |
|---|---|---|
| GET | `/employees` | List employees |
| GET | `/employees/:id` | Get one employee |
| POST | `/employees` | Create employee |
| PATCH | `/employees/:id` | Update employee |
| DELETE | `/employees/:id` | Soft delete |
| GET | `/employees/:id/team-history` | Transfer history |
| PATCH | `/employees/:id/transfer-team` | Transfer to new team |
| GET | `/employees/:id/target-progress` | Quarter target info |
| GET | `/employees/sales-dept` | All Sales dept employees |

### GET /employees query params
```
?department=Sales|IT|HR|...
?isActive=true|false
?search=text                  searches name, code, email
?seniorityLevel=TeamLeader
?teamId=ObjectId
?page=1&limit=20
?sortBy=name&order=asc|desc
```

### POST /employees body
```javascript
{
  name: String,               // required
  nationalId: String,         // required, unique
  department: String,         // required, enum
  managerId: String,          // required ObjectId

  // Sales-only (required if dept = Sales)
  jobTitle: String,
  seniorityLevel: String,
  target: Number,
  currentTeamId: String,
  teamJoinDate: Date,

  hireDate: Date,             // required
  endDate: Date,              // optional
  email: String,              // required, unique
  phone: String               // required
}
```

### PATCH /employees/:id/transfer-team body
```javascript
{
  newTeamId: String,          // required ObjectId
  transferDate: Date          // required
}
```

### GET /employees/:id/target-progress query
```
?quarterId=Q2-2026            // required
```

---

## TEAMS `/api/v1/teams`

| Method | Path | Description |
|---|---|---|
| GET | `/teams` | List teams |
| GET | `/teams/:id` | Get team + members |
| POST | `/teams` | Create team |
| PATCH | `/teams/:id` | Update team |
| DELETE | `/teams/:id` | Soft delete |
| GET | `/teams/:id/target-summary` | Quarter target agg |
| POST | `/teams/:id/reassign-members` | Reassign on leader exit |

### POST /teams body
```javascript
{
  teamLeaderId: String,       // required ObjectId (Sales employee)
  memberIds: [String]         // ObjectId array (Sales employees)
}
// name is auto-set from leader's name
```

### POST /teams/:id/reassign-members body
```javascript
{
  membersReassignment: [
    { employeeId: String, newTeamId: String }
  ]
}
```

---

## CLIENTS `/api/v1/clients`

| Method | Path | Description |
|---|---|---|
| GET | `/clients` | List clients |
| GET | `/clients/:id` | Get one client |
| POST | `/clients` | Create client |
| PATCH | `/clients/:id` | Update client |
| DELETE | `/clients/:id` | Soft delete |
| GET | `/clients/:id/sales` | Sales for this client |

### GET /clients query params
```
?search=text          searches name, code
?isActive=true|false
?page=1&limit=20
```

### POST /clients body
```javascript
{
  name: String,               // required
  taxRegistrationNumber: String,  // optional
  googleMapsLink: String      // optional
}
// code is auto-generated: CLT-XXXX
```

---

## SALES `/api/v1/sales`

| Method | Path | Description |
|---|---|---|
| GET | `/sales` | List sales |
| GET | `/sales/:id` | Get full sale |
| POST | `/sales` | Create sale (draft) |
| PATCH | `/sales/:id` | Update draft sale |
| DELETE | `/sales/:id` | Soft delete (draft only) |
| POST | `/sales/:id/confirm` | Confirm sale |
| GET | `/sales/:id/commission-preview` | Preview calculations |
| GET | `/sales/quarter/:quarterId` | Sales by quarter |

### GET /sales query params
```
?status=draft|confirmed|claimed|collected
?quarterId=Q2-2026
?clientId=ObjectId
?employeeId=ObjectId     sales where employee is a seller
?source=Private
?search=text             sale number, project, client name
?page=1&limit=20
?sortBy=contractDate&order=desc
```

### POST /sales body
```javascript
{
  source: String,             // required (from settings)
  bookingDate: Date,
  contractDate: Date,         // required
  clientRegistrationDate: Date, // required unless source = Private

  unitLocation: String,       // google maps link
  projectName: String,        // required
  clientId: String,           // required ObjectId
  unitNumber: String,         // required
  unitType: String,           // required
  unitValue: Number,          // required

  developerCollectionPercentage: Number,  // required (100/50/33.333/25/custom)
  contractCommissionPercentage: Number,   // required
  invoiceStatus: String,      // required (from settings)
  expectedCollectionDate: Date,
  incentivePercentage: Number, // optional

  sellers: [
    {
      employeeId: String,     // required ObjectId
      sharePercentage: Number // required, all must sum to 100
    }
  ]
}
// All commission fields calculated server-side
// saleNumber auto-generated: SALE-XXXX
// quarterId auto-detected from contractDate
// status defaults to "draft"
```

### POST /sales/:id/confirm
```javascript
// No body needed
// Backend validates sellers sum = 100
// Sets status = "confirmed"
// Returns 400 if validation fails
```

### GET /sales/:id/commission-preview query
```
?unitValue=5000000&contractCommissionPercentage=2.5&developerCollectionPercentage=50
// Returns preview without saving
```

---

## CLAIMS `/api/v1/claims`

| Method | Path | Description |
|---|---|---|
| GET | `/claims` | List claims |
| GET | `/claims/:id` | Get one claim |
| POST | `/claims` | Create claim from sale |
| PATCH | `/claims/:id` | Update claim |
| DELETE | `/claims/:id` | Delete pending claim |
| PATCH | `/claims/:id/collect` | Mark as collected |
| PATCH | `/claims/:id/status` | Update status only |

### GET /claims query params
```
?status=pending|submitted|collected|disputed
?quarterId=Q2-2026
?search=text
?page=1&limit=20
```

### POST /claims body
```javascript
{
  saleId: String    // required ObjectId (must be status=confirmed)
}
// claimNumber auto-generated: CLM-XXXX
// All other fields copied from sale
```

### PATCH /claims/:id/collect body
```javascript
{
  collectionDate: Date,       // required
  collectedAmount: Number     // required
}
```

### PATCH /claims/:id/status body
```javascript
{
  status: String,             // pending|submitted|collected|disputed
  notes: String               // optional
}
```

---

## TARGETS `/api/v1/targets`

| Method | Path | Description |
|---|---|---|
| GET | `/targets/employee/:id` | Employee target for quarter |
| GET | `/targets/team/:id` | Team target summary |
| GET | `/targets/summary` | All employees overview |

### All target routes require
```
?quarterId=Q2-2026    // required
```

### Response: GET /targets/employee/:id
```javascript
{
  employeeId: String,
  employeeName: String,
  code: String,
  quarterId: String,
  fullTarget: Number,
  actualWorkingDays: Number,
  adjustedTarget: Number,      // (fullTarget / 90) × workingDays
  achievedSales: Number,       // sum of commissionValues for this employee
  achievementPercentage: Number,
  gap: Number                  // adjustedTarget - achieved
}
```

### Response: GET /targets/summary
```javascript
{
  quarterId: String,
  employees: [
    {
      employeeId, employeeName, teamName,
      adjustedTarget, achievedSales, achievementPercentage, gap
    }
  ],
  totals: {
    totalAdjustedTarget, totalAchieved, overallAchievementPercentage
  }
}
```

---

## SETTINGS `/api/v1/settings`

| Method | Path | Description |
|---|---|---|
| GET | `/settings` | All lookup values |
| GET | `/settings/:type` | By type |
| POST | `/settings` | Add new value |
| PATCH | `/settings/:id` | Update value |
| DELETE | `/settings/:id` | Delete (non-default only) |

### GET /settings/:type values
```
saleSource | invoiceType | collectionPercentage
```

### POST /settings body
```javascript
{
  type: String,       // required enum
  value: String,      // required
  label: String,      // required
  sortOrder: Number   // optional
}
// isDefault defaults to false
// isActive defaults to true
```

---

## HTTP Status Codes Used

| Code | Meaning |
|---|---|
| 200 | OK — GET, PATCH, DELETE success |
| 201 | Created — POST success |
| 400 | Bad Request — validation error |
| 401 | Unauthorized — missing/invalid token |
| 403 | Forbidden — not allowed |
| 404 | Not Found — resource doesn't exist |
| 409 | Conflict — duplicate (email, nationalId) |
| 500 | Internal Server Error |
