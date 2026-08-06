const noisePredictionService = require("../services/noisePredictionService");

/**
 * POST /api/noise/predictions
 */
async function storePrediction(req, res, next) {
  try {
    const result = await noisePredictionService.storePrediction(req.body);

    if (!result.ok) {
      return res.status(422).json({
        error: "Noise prediction payload validation failed",
        details: result.errors,
      });
    }

    res.status(201).json(result.data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/noise/predictions/latest
 */
async function getLatest(req, res, next) {
  try {
    const prediction = await noisePredictionService.fetchLatestPrediction();
    if (!prediction) {
      return res.status(404).json({ error: "No noise predictions found yet" });
    }
    res.json(prediction);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/noise/predictions/history
 */
async function getHistory(req, res, next) {
  try {
    const { page, limit, offset } = req.pagination;
    const result = await noisePredictionService.fetchPredictionHistory({ page, limit, offset });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { storePrediction, getLatest, getHistory };
