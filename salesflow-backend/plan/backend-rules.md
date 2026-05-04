# 📏 Backend Coding Rules — SalesFlow

> Follow these rules exactly when writing backend code.

---

## Architecture Pattern

```
Request → Route → Controller → Service → Model → DB
                       ↓
                   Validator (Joi)
                       ↓
                   Utils (commission, quarter, codes)
```

- **Routes**: define path + middleware + controller function only. No logic.
- **Controllers**: handle req/res. Call service. Return response. No DB calls.
- **Services**: all business logic, DB queries. No req/res objects.
- **Models**: Mongoose schema + model only. No business logic.
- **Utils**: pure functions. No DB access.

---

## Controller Pattern

```javascript
// employee.controller.js
const employeeService = require('../services/employee.service');
const { sendSuccess, sendError } = require('../utils/response.utils');

const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    return sendSuccess(res, employee, 201);
  } catch (error) {
    next(error);  // pass to error middleware
  }
};

const getEmployees = async (req, res, next) => {
  try {
    const { data, pagination } = await employeeService.getEmployees(req.query);
    return sendSuccess(res, data, 200, pagination);
  } catch (error) {
    next(error);
  }
};

module.exports = { createEmployee, getEmployees, ... };
```

---

## Service Pattern

```javascript
// employee.service.js
const Employee = require('../models/employee.model');
const EmployeeTeamHistory = require('../models/employee-team-history.model');
const Team = require('../models/team.model');
const { generateCode } = require('../utils/code-generator');
const { getQuarterId, calculateEmployeeQuarterDays } = require('../utils/quarter.utils');
const { paginate } = require('../utils/pagination.utils');

const createEmployee = async (data) => {
  // 1. Generate code
  const code = await generateCode(Employee, 'code', 'EMP');

  // 2. Calculate working days
  const hireDate = new Date(data.hireDate);
  const today = new Date();
  const totalWorkingDays = Math.floor((today - hireDate) / (1000 * 60 * 60 * 24));

  // 3. Create employee
  const employee = await Employee.create({
    ...data,
    code,
    totalWorkingDays,
    currentQuarterWorkingDays: data.teamJoinDate
      ? Math.floor((today - new Date(data.teamJoinDate)) / (1000 * 60 * 60 * 24))
      : 0
  });

  // 4. If sales dept + team assigned: create history record + update team
  if (data.department === 'Sales' && data.currentTeamId) {
    await EmployeeTeamHistory.create({
      employeeId: employee._id,
      teamId: data.currentTeamId,
      joinDate: data.teamJoinDate,
      quarterId: getQuarterId(new Date(data.teamJoinDate))
    });
    await Team.findByIdAndUpdate(
      data.currentTeamId,
      { $addToSet: { memberIds: employee._id } }
    );
  }

  return employee;
};

module.exports = { createEmployee, ... };
```

---

## Route Pattern

```javascript
// employee.routes.js
const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate.middleware');
const { createEmployeeSchema, updateEmployeeSchema } = require('../validators/employee.validator');
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getTeamHistory,
  transferTeam,
  getTargetProgress,
  getSalesDeptEmployees
} = require('../controllers/employee.controller');

router.get('/',              getEmployees);
router.get('/sales-dept',    getSalesDeptEmployees);
router.get('/:id',           getEmployee);
router.post('/',             validate(createEmployeeSchema), createEmployee);
router.patch('/:id',         validate(updateEmployeeSchema), updateEmployee);
router.delete('/:id',        deleteEmployee);
router.get('/:id/team-history',    getTeamHistory);
router.patch('/:id/transfer-team', transferTeam);
router.get('/:id/target-progress', getTargetProgress);

module.exports = router;
```

---

## Validator Pattern (Joi)

```javascript
// validators/employee.validator.js
const Joi = require('joi');

const createEmployeeSchema = Joi.object({
  name:       Joi.string().trim().required(),
  nationalId: Joi.string().required(),
  department: Joi.string().valid(
    'Operations', 'IT', 'Marketing', 'HR', 'Finance', 'Sales', 'TopManagement'
  ).required(),
  managerId:  Joi.string().length(24).required(),

  // Conditional sales fields
  jobTitle:       Joi.when('department', {
    is: 'Sales',
    then: Joi.string().optional(),
    otherwise: Joi.forbidden()
  }),
  seniorityLevel: Joi.when('department', {
    is: 'Sales',
    then: Joi.string().valid('Fresh','BA','BC','Senior','SV','TeamLeader','SalesManager').required(),
    otherwise: Joi.forbidden()
  }),
  target: Joi.when('department', {
    is: 'Sales',
    then: Joi.number().min(0).required(),
    otherwise: Joi.forbidden()
  }),
  currentTeamId: Joi.when('department', {
    is: 'Sales',
    then: Joi.string().length(24).optional(),
    otherwise: Joi.forbidden()
  }),
  teamJoinDate: Joi.when('currentTeamId', {
    is: Joi.exist(),
    then: Joi.date().required(),
    otherwise: Joi.optional()
  }),

  hireDate: Joi.date().required(),
  endDate:  Joi.date().optional(),
  email:    Joi.string().email().required(),
  phone:    Joi.string().required()
});

module.exports = { createEmployeeSchema };
```

---

## Validate Middleware

```javascript
// middleware/validate.middleware.js
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    }));
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  next();
};

module.exports = { validate };
```

---

## Auth Middleware

```javascript
// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = { authMiddleware };
```

---

## Key Rules

1. **Always soft delete** — set `isActive: false`, never use `deleteOne`
2. **Always validate on server** — never trust frontend calculations
3. **Recalculate commissions server-side** on every sale create/update
4. **Denormalize names** — save `clientName`, `employeeName` in sale document
5. **Use `next(error)`** in controllers — never send error response directly
6. **Auto-generate codes atomically** — use findOne + sort to avoid race conditions
7. **Quarter bounds are fixed** — always use `getQuarterBounds()` utility
8. **Seller validation** — sellers sum must equal 100 before confirming sale
9. **Team name = leader name** — auto-update on every team leader change
10. **Populate minimally** — only populate what the response needs
