const predictionService = require("../services/predictionService");
const { validatePagination } = require("../middleware/validator");

/**
 * POST /api/predictions
 * Accepts a prediction payload from the ML model and stores it.
 */
async function storePrediction(req, res, next) {
  try {
    const result = await predictionService.storePrediction(req.body);

    if (!result.ok) {
      return res.status(422).json({
        error: "Prediction payload validation failed",
        details: result.errors,
      });
    }

    res.status(201).json(result.data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/predictions/latest
 * Returns the most recently stored ML prediction.
 */
async function getLatest(req, res, next) {
  try {
    const prediction = await predictionService.fetchLatestPrediction();
    if (!prediction) {
      return res.status(404).json({ error: "No predictions found yet" });
    }
    res.json(prediction);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/predictions/history
 * Returns a paginated list of ML predictions (newest first).
 * Uses validatePagination middleware (applied in routes).
 */
async function getHistory(req, res, next) {
  try {
    const { page, limit, offset } = req.pagination;
    const result = await predictionService.fetchPredictionHistory({ page, limit, offset });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { storePrediction, getLatest, getHistory };
