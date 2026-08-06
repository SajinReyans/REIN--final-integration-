const noiseService = require("../services/noiseService");

// ─── Noise Readings ─────────────────────────────────────────────────────────

async function getLatest(req, res, next) {
  try {
    const latest = await noiseService.fetchLatest();
    if (!latest) {
      return res.status(404).json({ error: "No noise readings found yet" });
    }
    res.json(latest);
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const { page, limit, offset } = req.pagination;
    const result = await noiseService.fetchHistory({ page, limit, offset });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getRecentReadings(req, res, next) {
  try {
    let limit = parseInt(req.query.limit, 10);
    if (!Number.isInteger(limit) || limit < 1) limit = 50;
    if (limit > 500) limit = 500; // Hard cap for sliding window

    const result = await noiseService.fetchRecentReadings(limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const reading = await noiseService.fetchById(req.params.id);
    if (!reading) {
      return res.status(404).json({ error: "Noise reading not found" });
    }
    res.json(reading);
  } catch (err) {
    next(err);
  }
}

// ─── Noise Features ─────────────────────────────────────────────────────────

async function getLatestFeatures(req, res, next) {
  try {
    const features = await noiseService.fetchLatestFeatures();
    if (!features) {
      return res.status(404).json({ error: "No noise features computed yet" });
    }
    res.json(features);
  } catch (err) {
    next(err);
  }
}

// ─── Noise Predictions ──────────────────────────────────────────────────────

async function getLatestPrediction(req, res, next) {
  try {
    const prediction = await noiseService.fetchLatestPrediction();
    if (!prediction) {
      return res.status(404).json({ error: "No noise predictions found yet" });
    }
    res.json(prediction);
  } catch (err) {
    next(err);
  }
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

async function getDashboard(req, res, next) {
  try {
    const dashboard = await noiseService.fetchDashboard();
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLatest,
  getHistory,
  getRecentReadings,
  getById,
  getLatestFeatures,
  getLatestPrediction,
  getDashboard,
};
