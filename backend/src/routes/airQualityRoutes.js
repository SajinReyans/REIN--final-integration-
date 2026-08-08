const express = require("express");
const router  = express.Router();

const airQualityController    = require("../controllers/airQualityController");
const airPredictionController = require("../controllers/airPredictionController");
const { validatePagination }  = require("../middleware/validator");

// ─── Air Quality Readings ────────────────────────────────────────────────────────
// NOTE: specific sub-paths MUST be registered before the /:id wildcard

router.get("/air/dashboard",            airQualityController.getDashboard);
router.get("/air/features/latest",      airQualityController.getLatestFeatures);
router.get("/air/features/history",     validatePagination, airQualityController.getFeatureHistory);
router.get("/air/predictions/latest",   airQualityController.getLatestPrediction);

router.get("/air/readings/floors",      airQualityController.getFloorComparison);
router.get("/air/readings/recent",      airQualityController.getRecentReadings);
router.get("/air/readings/latest",      airQualityController.getLatest);
router.get("/air/readings/history",     validatePagination, airQualityController.getHistory);
router.get("/air/readings/:id",         airQualityController.getById);

// ─── Air Quality ML Predictions ───────────────────────────────────────────────
router.post("/air/predictions",         airPredictionController.storePrediction);
router.get("/air/predictions/latest",   airPredictionController.getLatest);
router.get("/air/predictions/history",  validatePagination, airPredictionController.getHistory);

module.exports = router;
