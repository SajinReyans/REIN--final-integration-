const path = require("path");
const express = require("express");

const weatherRoutes = require("./routes/weatherRoutes");
const airQualityRoutes = require("./routes/airQualityRoutes");
const noiseRoutes = require("./routes/noiseRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));

  // Allow the React dashboard to call this API when hosted separately.
  app.use((req, res, next) => {
    const allowedOrigin = process.env.FRONTEND_URL || "*";
    res.header("Access-Control-Allow-Origin", allowedOrigin);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "..", "public")));

  // Dashboard page
  app.get("/", (req, res) => {
    res.render("dashboard");
  });

  // REST API
  app.use("/api", weatherRoutes);
  app.use("/api", airQualityRoutes);
  app.use("/api", noiseRoutes);

  // 404 + centralized error handling (must be last)
  app.use("/api", notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
