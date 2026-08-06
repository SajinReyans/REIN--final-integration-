const airQualityService = require("../services/airQualityService");

// ─── Air Quality Readings ────────────────────────────────────────────────────

/**
 * GET /api/air/readings/latest
 * Returns the most recent air quality sensor reading.
 */
async function getLatest(req, res, next) {
  try {
    const latest = await airQualityService.fetchLatest();
    if (!latest) {
      return res.status(404).json({ error: "No air quality readings found yet" });
    }
    res.json(latest);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/air/readings/history
 * Returns paginated air quality readings, newest first.
 * Requires validatePagination middleware.
 */
async function getHistory(req, res, next) {
  try {
    const { page, limit, offset } = req.pagination;
    const result = await airQualityService.fetchHistory({ page, limit, offset });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/air/readings/floors?location=...
 * Returns a side-by-side comparison of the latest readings for each floor at a location.
 */
async function getFloorComparison(req, res, next) {
  try {
    const { location } = req.query;
    if (!location) {
      return res.status(400).json({ error: "Query parameter 'location' is required" });
    }
    const result = await airQualityService.fetchFloorComparison(location);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/air/readings/recent?limit=...
 * Returns the most recent N readings for the external ML service to build a sliding window.
 */
async function getRecentReadings(req, res, next) {
  try {
    let limit = parseInt(req.query.limit, 10);
    if (!Number.isInteger(limit) || limit < 1) limit = 50;
    if (limit > 500) limit = 500; // Hard cap for sliding window

    const result = await airQualityService.fetchRecentReadings(limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/air/readings/:id
 * Returns a single air quality reading by its UUID.
 */
async function getById(req, res, next) {
  try {
    const reading = await airQualityService.fetchById(req.params.id);
    if (!reading) {
      return res.status(404).json({ error: "Air quality reading not found" });
    }
    res.json(reading);
  } catch (err) {
    next(err);
  }
}

// ─── Air Quality Features ────────────────────────────────────────────────────

/**
 * GET /api/air/features/latest
 * Returns the most recently computed AQI features.
 */
async function getLatestFeatures(req, res, next) {
  try {
    const features = await airQualityService.fetchLatestFeatures();
    if (!features) {
      return res.status(404).json({ error: "No air quality features computed yet" });
    }
    res.json(features);
  } catch (err) {
    next(err);
  }
}

// ─── Air Quality Predictions ─────────────────────────────────────────────────

/**
 * GET /api/air/predictions/latest
 * Returns the most recently stored air quality ML prediction.
 */
async function getLatestPrediction(req, res, next) {
  try {
    const prediction = await airQualityService.fetchLatestPrediction();
    if (!prediction) {
      return res.status(404).json({ error: "No air quality predictions found yet" });
    }
    res.json(prediction);
  } catch (err) {
    next(err);
  }
}

// ─── Dashboard (combined) ────────────────────────────────────────────────────

/**
 * GET /api/air/dashboard
 * Returns the latest reading, computed features, and ML prediction in a
 * single response. Sections that have no data yet will be null.
 */
async function getDashboard(req, res, next) {
  try {
    const dashboard = await airQualityService.fetchDashboard();
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLatest,
  getHistory,
  getFloorComparison,
  getRecentReadings,
  getById,
  getLatestFeatures,
  getLatestPrediction,
  getDashboard,
};
