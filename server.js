// server.js
const express = require("express");
const cors = require("cors");
const { testConnection } = require("./config/db");
const { syncModels } = require("./models");
const routes = require("./routes");
const { errorHandler } = require("./middlewares/errorHandler");
const env = require("./config/env");

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up API routes
app.use("/api", routes);

// Error handler
app.use(errorHandler);

// Start server
const PORT = env.PORT;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync models
    await syncModels();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app; // For testing
