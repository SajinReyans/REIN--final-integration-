const weatherModel           = require("../models/weatherModel");
const weatherFeaturesModel   = require("../models/weatherFeaturesModel");
const weatherPredictionsModel = require("../models/weatherPredictionsModel");
const featureEngineeringService = require("./featureEngineeringService");
const { getIO } = require("../config/socket");

/**
 * Stores a validated weather reading in PostgreSQL, then:
 *   1. Emits the new record over Socket.IO to all connected dashboards
 *   2. Triggers feature engineering (async, non-blocking for the caller)
 *
 * If storage fails, the error is logged and no downstream actions occur —
 * the server keeps running normally.
 *
 * @param {object} validatedPayload - Output of validateWeatherPayload()
 * @returns {Promise<object|null>} The stored reading row, or null on failure
 */
async function storeAndBroadcastReading(validatedPayload) {
  // ── 1. Persist the raw reading ──────────────────────────────────────────
  let stored;
  try {
    stored = await weatherModel.insertReading(validatedPayload);
    console.log(`[DATABASE] Weather reading stored (device: ${stored.device_id}, id: ${stored.id})`);
  } catch (err) {
    console.error("[ERROR] Failed to store weather reading:", err.message);
    return null; // do not emit, do not throw — keep the server alive
  }

  // ── 2. Broadcast raw reading over Socket.IO ─────────────────────────────
  try {
    const io = getIO();
    io.emit("weather:new", stored);
    console.log("[SOCKET] Emitted weather:new");
  } catch (err) {
    // Socket.IO not ready or emit failed — the record is safely stored regardless
    console.error("[ERROR] Failed to emit weather:new:", err.message);
  }

  // ── 3. Compute and store derived features (non-blocking) ────────────────
  featureEngineeringService.computeAndStore(stored).then((features) => {
    if (features) {
      try {
        const io = getIO();
        io.emit("weather:features", features);
        console.log("[SOCKET] Emitted weather:features");
      } catch (err) {
        console.error("[ERROR] Failed to emit weather:features:", err.message);
      }
    }
  });

  return stored;
}

// ─── Weather Readings ────────────────────────────────────────────────────────

/**
 * Returns the most recent weather reading.
 * @returns {Promise<object|null>}
 */
async function fetchLatest() {
  return weatherModel.getLatestReading();
}

/**
 * Returns paginated reading history with total count.
 * @param {object} params - { page, limit, offset }
 * @returns {Promise<object>}
 */
async function fetchHistory({ page, limit, offset }) {
  const { rows, total } = await weatherModel.getHistory({ limit, offset });
  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

/**
 * Returns a single reading by its UUID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function fetchById(id) {
  return weatherModel.getReadingById(id);
}

/**
 * Returns aggregate statistics across all readings.
 * @returns {Promise<object>}
 */
async function fetchStats() {
  return weatherModel.getStats();
}

// ─── Weather Features ────────────────────────────────────────────────────────

/**
 * Returns the most recently computed weather features row.
 * @returns {Promise<object|null>}
 */
async function fetchLatestFeatures() {
  return weatherFeaturesModel.getLatestFeatures();
}

// ─── Weather Predictions ─────────────────────────────────────────────────────

/**
 * Returns the most recently stored ML prediction.
 * @returns {Promise<object|null>}
 */
async function fetchLatestPrediction() {
  return weatherPredictionsModel.getLatestPrediction();
}

// ─── Dashboard (combined) ────────────────────────────────────────────────────

/**
 * Fetches the latest reading, features, and prediction in parallel and
 * returns them as a single combined response object for the dashboard.
 *
 * @returns {Promise<object>}
 */
async function fetchDashboard() {
  const [reading, features, prediction] = await Promise.all([
    weatherModel.getLatestReading(),
    weatherFeaturesModel.getLatestFeatures(),
    weatherPredictionsModel.getLatestPrediction(),
  ]);

  return {
    reading:    reading    || null,
    features:   features   || null,
    prediction: prediction || null,
  };
}

module.exports = {
  storeAndBroadcastReading,
  fetchLatest,
  fetchHistory,
  fetchById,
  fetchStats,
  fetchLatestFeatures,
  fetchLatestPrediction,
  fetchDashboard,
};
