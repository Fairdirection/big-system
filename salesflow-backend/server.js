require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./src/config/db');
const seedUsers = require('./seed/users.seed');
const seedSettings = require('./seed/settings.seed');
const routes = require('./src/routes/index');
const { errorHandler } = require('./src/middleware/error.middleware');
const { notFoundHandler } = require('./src/middleware/notFound.middleware');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api/v1', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

console.log('Connecting to MongoDB...');
connectDB().then(async () => {
  console.log('Database connected, synchronizing seeds...');
  await seedSettings();
  await seedUsers();
  console.log('Starting server...');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to start server:', err);
});
