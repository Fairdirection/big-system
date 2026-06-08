// Root startup script for Hostinger Node.js Application
const path = require("path");

// Load backend environment variables from the salesflow-backend directory
require("dotenv").config({ path: path.join(__dirname, "salesflow-backend", ".env") });

// Start the Express backend server
require("./salesflow-backend/server.js");
