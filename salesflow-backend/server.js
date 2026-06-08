const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./src/config/db");
const seedUsers = require("./seed/users.seed");
const seedSettings = require("./seed/settings.seed");
const routes = require("./src/routes/index");
const { errorHandler } = require("./src/middleware/error.middleware");
const { notFoundHandler } = require("./src/middleware/notFound.middleware");
const { initBackupScheduler } = require("./src/utils/backup.scheduler");
const { initBackupDirs } = require("./src/services/backup.service");

const app = express();

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:4200")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Accept all origins
      callback(null, true);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

// Routes
app.use("/api/v1", routes);

// Serve static frontend files in production/integrated mode
const frontendPath = path.join(__dirname, "../salesflow-frontend/dist/salesflow-frontend/browser");

if (fs.existsSync(path.join(frontendPath, "index.html"))) {
  console.log("Serving frontend static files from:", frontendPath);
  app.use(express.static(frontendPath));
  
  // Wildcard route to handle Angular's client-side routing
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  console.log("Frontend build index.html not found. Backend running in API-only mode.");
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

console.log("Connecting to MongoDB...");
connectDB()
  .then(async () => {
    console.log("Database connected, synchronizing seeds...");
    await seedSettings();
    await seedUsers();

    // Initialize backup service
    await initBackupDirs();
    initBackupScheduler();

    console.log("Starting server...");
    app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
  });
