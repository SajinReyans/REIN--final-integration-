const airPredictionService = require("../services/airPredictionService");

/**
 * POST /api/air/predictions
 * Accepts an air quality prediction payload from the ML model and stores it.
 */
async function storePrediction(req, res, next) {
  try {
    const result = await airPredictionService.storePrediction(req.body);

    if (!result.ok) {
      return res.status(422).json({
        error: "Air quality prediction payload validation failed",
        details: result.errors,
      });
    }

    res.status(201).json(result.data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/air/predictions/latest
 * Returns the most recently stored air quality ML prediction.
 */
async function getLatest(req, res, next) {
  try {
    const prediction = await airPredictionService.fetchLatestPrediction();
    if (!prediction) {
      return res.status(404).json({ error: "No air quality predictions found yet" });
    }
    res.json(prediction);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/air/predictions/history
 * Returns a paginated list of air quality ML predictions (newest first).
 * Uses validatePagination middleware (applied in routes).
 */
async function getHistory(req, res, next) {
  try {
    const { page, limit, offset } = req.pagination;
    const result = await airPredictionService.fetchPredictionHistory({ page, limit, offset });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { storePrediction, getLatest, getHistory };
