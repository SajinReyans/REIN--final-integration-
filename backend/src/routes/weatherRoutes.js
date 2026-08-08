const express = require("express");
const router  = express.Router();

const weatherController    = require("../controllers/weatherController");
const predictionController = require("../controllers/predictionController");
const { validatePagination } = require("../middleware/validator");

// ─── Weather Readings ────────────────────────────────────────────────────────
// NOTE: specific sub-paths (/features/latest, /predictions/latest, /dashboard,
//       /stats) MUST be registered before the /:id wildcard to prevent Express
//       matching them as UUIDs.

router.get("/weather/dashboard",            weatherController.getDashboard);
router.get("/weather/features/latest",      weatherController.getLatestFeatures);
router.get("/weather/features/history",     validatePagination, weatherController.getFeatureHistory);
router.get("/weather/predictions/latest",   weatherController.getLatestPrediction);
router.get("/weather/stats",                weatherController.getStats);
router.get("/weather/latest",               weatherController.getLatest);
router.get("/weather/history",              validatePagination, weatherController.getHistory);
router.get("/weather/:id",                  weatherController.getById);

// ─── ML Predictions ──────────────────────────────────────────────────────────
router.post("/predictions",                 predictionController.storePrediction);
router.get("/predictions/latest",           predictionController.getLatest);
router.get("/predictions/history",          validatePagination, predictionController.getHistory);

// ─── Health ───────────────────────────────────────────────────────────────────
router.get("/health",                       weatherController.getHealth);

module.exports = router;
