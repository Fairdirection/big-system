# 🗂️ Backend Folder Structure — SalesFlow (Express.js)

---

## Full Folder Tree

```
salesflow-backend/
│
├── package.json
├── .env
├── .env.example
├── .gitignore
├── server.js                        ← entry point
│
├── src/
│   │
│   ├── config/
│   │   ├── db.js                    ← MongoDB connection
│   │   └── jwt.js                   ← JWT config & helpers
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js        ← verify JWT, attach user
│   │   ├── validate.middleware.js    ← Joi validation wrapper
│   │   ├── error.middleware.js       ← global error handler
│   │   └── notFound.middleware.js   ← 404 handler
│   │
│   ├── models/
│   │   ├── user.model.js
│   │   ├── employee.model.js
│   │   ├── employee-team-history.model.js
│   │   ├── team.model.js
│   │   ├── client.model.js
│   │   ├── sale.model.js
│   │   ├── claim.model.js
│   │   └── setting.model.js
│   │
│   ├── routes/
│   │   ├── index.js                 ← mounts all routers
│   │   ├── auth.routes.js
│   │   ├── employee.routes.js
│   │   ├── team.routes.js
│   │   ├── client.routes.js
│   │   ├── sale.routes.js
│   │   ├── claim.routes.js
│   │   ├── target.routes.js
│   │   └── setting.routes.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── employee.controller.js
│   │   ├── team.controller.js
│   │   ├── client.controller.js
│   │   ├── sale.controller.js
│   │   ├── claim.controller.js
│   │   ├── target.controller.js
│   │   └── setting.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── employee.service.js
│   │   ├── team.service.js
│   │   ├── client.service.js
│   │   ├── sale.service.js
│   │   ├── claim.service.js
│   │   ├── target.service.js
│   │   └── setting.service.js
│   │
│   ├── validators/                  ← Joi schemas
│   │   ├── auth.validator.js
│   │   ├── employee.validator.js
│   │   ├── team.validator.js
│   │   ├── client.validator.js
│   │   ├── sale.validator.js
│   │   ├── claim.validator.js
│   │   └── setting.validator.js
│   │
│   └── utils/
│       ├── code-generator.js        ← EMP-XXXX, CLT-XXXX, etc.
│       ├── commission.utils.js      ← all commission calculations
│       ├── quarter.utils.js         ← quarter detection + bounds
│       ├── response.utils.js        ← success/error response helpers
│       └── pagination.utils.js      ← pagination helper
│
└── seed/
    ├── index.js                     ← run all seeds
    ├── settings.seed.js
    ├── users.seed.js
    └── sample-data.seed.js
```

---

## Key File Contents

### server.js
```javascript
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./src/config/db');
const routes = require('./src/routes/index');
const { errorHandler } = require('./src/middleware/error.middleware');
const { notFoundHandler } = require('./src/middleware/notFound.middleware');

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:4200' }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/v1', routes);

// Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
```

### src/routes/index.js
```javascript
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');

router.use('/auth',      require('./auth.routes'));
router.use('/employees', authMiddleware, require('./employee.routes'));
router.use('/teams',     authMiddleware, require('./team.routes'));
router.use('/clients',   authMiddleware, require('./client.routes'));
router.use('/sales',     authMiddleware, require('./sale.routes'));
router.use('/claims',    authMiddleware, require('./claim.routes'));
router.use('/targets',   authMiddleware, require('./target.routes'));
router.use('/settings',  authMiddleware, require('./setting.routes'));

module.exports = router;
```

### src/utils/response.utils.js
```javascript
const sendSuccess = (res, data, statusCode = 200, pagination = null) => {
  const response = { success: true, data };
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
};

const sendError = (res, message, statusCode = 400, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
```

### src/middleware/error.middleware.js
```javascript
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      errors: [{ field, message: `${field} must be unique` }]
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  return res.status(500).json({ success: false, message: 'Internal server error' });
};

module.exports = { errorHandler };
```

### src/utils/pagination.utils.js
```javascript
const paginate = async (model, filter, options) => {
  const { page = 1, limit = 20, sort = { createdAt: -1 }, populate = '' } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.find(filter).sort(sort).skip(skip).limit(limit).populate(populate),
    model.countDocuments(filter)
  ]);

  return {
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = { paginate };
```

---

## .env.example
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/salesflow_db
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:4200
```

---

## package.json dependencies
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "mongoose": "^8.0.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "joi": "^17.11.0",
    "cors": "^2.8.5",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seed/index.js"
  }
}
```
