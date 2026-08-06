const weatherService = require("../services/weatherService");
const { getConnectionStatus } = require("../config/database");
const { getMqttStatus } = require("../config/mqtt");

// ─── Weather Readings ────────────────────────────────────────────────────────

/**
 * GET /api/weather/latest
 * Returns the most recent raw sensor reading.
 */
async function getLatest(req, res, next) {
  try {
    const latest = await weatherService.fetchLatest();
    if (!latest) {
      return res.status(404).json({ error: "No weather readings found yet" });
    }
    res.json(latest);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/weather/history
 * Returns paginated weather readings, newest first.
 * Requires validatePagination middleware.
 */
async function getHistory(req, res, next) {
  try {
    const { page, limit, offset } = req.pagination;
    const result = await weatherService.fetchHistory({ page, limit, offset });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/weather/:id
 * Returns a single weather reading by its UUID.
 */
async function getById(req, res, next) {
  try {
    const reading = await weatherService.fetchById(req.params.id);
    if (!reading) {
      return res.status(404).json({ error: "Reading not found" });
    }
    res.json(reading);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/weather/stats
 * Returns aggregate statistics across all readings.
 */
async function getStats(req, res, next) {
  try {
    const stats = await weatherService.fetchStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

// ─── Weather Features ────────────────────────────────────────────────────────

/**
 * GET /api/weather/features/latest
 * Returns the most recently computed weather features (heat index, dew point, etc.).
 */
async function getLatestFeatures(req, res, next) {
  try {
    const features = await weatherService.fetchLatestFeatures();
    if (!features) {
      return res.status(404).json({ error: "No weather features computed yet" });
    }
    res.json(features);
  } catch (err) {
    next(err);
  }
}

// ─── Weather Predictions ─────────────────────────────────────────────────────

/**
 * GET /api/weather/predictions/latest
 * Returns the most recently stored ML prediction.
 */
async function getLatestPrediction(req, res, next) {
  try {
    const prediction = await weatherService.fetchLatestPrediction();
    if (!prediction) {
      return res.status(404).json({ error: "No predictions found yet" });
    }
    res.json(prediction);
  } catch (err) {
    next(err);
  }
}

// ─── Dashboard (combined) ────────────────────────────────────────────────────

/**
 * GET /api/weather/dashboard
 * Returns the latest reading, computed features, and ML prediction in a
 * single response. Sections that have no data yet will be null.
 */
async function getDashboard(req, res, next) {
  try {
    const dashboard = await weatherService.fetchDashboard();
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
}

// ─── System Health ───────────────────────────────────────────────────────────

/**
 * GET /api/health
 * Returns the connection status of the database and MQTT broker.
 */
async function getHealth(req, res) {
  const dbConnected   = getConnectionStatus();
  const mqttConnected = getMqttStatus();
  res.json({
    status:   dbConnected ? "ok" : "degraded",
    database: dbConnected   ? "connected" : "disconnected",
    mqtt:     mqttConnected ? "connected" : "disconnected",
  });
}

module.exports = {
  getLatest,
  getHistory,
  getById,
  getStats,
  getLatestFeatures,
  getLatestPrediction,
  getDashboard,
  getHealth,
};
