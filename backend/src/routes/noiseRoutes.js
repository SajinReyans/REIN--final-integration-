const express = require("express");
const router  = express.Router();

const noiseController           = require("../controllers/noiseController");
const noisePredictionController = require("../controllers/noisePredictionController");
const { validatePagination }    = require("../middleware/validator");

// ─── Noise Readings ──────────────────────────────────────────────────────────

router.get("/noise/dashboard",            noiseController.getDashboard);
router.get("/noise/features/latest",      noiseController.getLatestFeatures);
router.get("/noise/features/history",     validatePagination, noiseController.getFeatureHistory);
router.get("/noise/predictions/latest",   noiseController.getLatestPrediction);

router.get("/noise/readings/recent",      noiseController.getRecentReadings);
router.get("/noise/readings/latest",      noiseController.getLatest);
router.get("/noise/readings/history",     validatePagination, noiseController.getHistory);
router.get("/noise/readings/:id",         noiseController.getById);

// ─── Noise ML Predictions ────────────────────────────────────────────────────
router.post("/noise/predictions",         noisePredictionController.storePrediction);
router.get("/noise/predictions/latest",   noisePredictionController.getLatest);
router.get("/noise/predictions/history",  validatePagination, noisePredictionController.getHistory);

module.exports = router;
