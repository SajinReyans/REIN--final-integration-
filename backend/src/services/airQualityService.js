const buildingEnvironmentModel = require("../models/buildingEnvironmentModel");
const airQualityModel          = require("../models/airQualityModel");
const airFeatureModel          = require("../models/airFeatureModel");
const airPredictionModel       = require("../models/airPredictionModel");
const airFeatureService        = require("./airFeatureService");
const { getIO } = require("../config/socket");

/**
 * Orchestrates the storage and broadcast of incoming air quality sensor data.
 *
 * 1. Upserts building_environment (deduplicates temp/humidity per location).
 * 2. Inserts the raw per-floor reading (linked to the environment row).
 * 3. Emits 'air:new' over Socket.IO.
 * 4. Triggers feature engineering (async, non-blocking).
 *
 * @param {object} payload - Output of validateAirQualityPayload()
 * @returns {Promise<object|null>} The stored reading row, or null on failure
 */
async function storeAndBroadcastReading(payload) {
  let envId = null;

  // ── 1. Deduplicate/Upsert Building Environment ──────────────────────────
  try {
    // If the floor sensor provides temp/humidity, upsert it.
    // If not, find the most recent one for this location (up to 60 mins old).
    if (payload.temperature !== null && payload.humidity !== null) {
      const env = await buildingEnvironmentModel.upsertEnvironment({
        location: payload.location,
        timestamp: payload.timestamp,
        temperature: payload.temperature,
        humidity: payload.humidity,
        windowMinutes: 10,
      });
      envId = env.id;
    } else {
      const recentEnvs = await buildingEnvironmentModel.getRecentForLocation(payload.location, 60);
      if (recentEnvs.length > 0) {
        envId = recentEnvs[0].id; // use the most recent one
      }
    }
  } catch (err) {
    console.error("[ERROR] Failed to upsert building environment:", err.message);
    // Proceed anyway — the air reading can still be saved without an env link
  }

  // ── 2. Persist the raw reading ──────────────────────────────────────────
  let stored;
  try {
    stored = await airQualityModel.insertReading({
      deviceId:   payload.deviceId,
      location:   payload.location,
      floorLevel: payload.floorLevel,
      timestamp:  payload.timestamp,
      pm1:        payload.pm1,
      pm25:       payload.pm25,
      pm4:        payload.pm4,
      pm10:       payload.pm10,
      co2:        payload.co2,
      nox:        payload.nox,
      voc:        payload.voc,
      co:         payload.co,
      o3:         payload.o3,
      buildingEnvId: envId,
    });
    console.log(`[DATABASE] Air quality stored (device: ${stored.device_id}, floor: ${stored.floor_level})`);
  } catch (err) {
    console.error("[ERROR] Failed to store air quality reading:", err.message);
    return null; // do not emit, do not throw
  }

  // ── 3. Broadcast raw reading over Socket.IO ─────────────────────────────
  try {
    const io = getIO();
    io.emit("air:new", stored);
    console.log("[SOCKET] Emitted air:new");
  } catch (err) {
    console.error("[ERROR] Failed to emit air:new:", err.message);
  }

  // ── 4. Compute and store derived features (non-blocking) ────────────────
  airFeatureService.computeAndStore(stored).then((features) => {
    if (features) {
      try {
        const io = getIO();
        io.emit("air:features", features);
        console.log("[SOCKET] Emitted air:features");
      } catch (err) {
        console.error("[ERROR] Failed to emit air:features:", err.message);
      }
    }
  });

  return stored;
}

// ─── Air Quality Readings ────────────────────────────────────────────────────

/**
 * Returns the most recent air quality reading.
 * @returns {Promise<object|null>}
 */
async function fetchLatest() {
  return airQualityModel.getLatestReading();
}

/**
 * Returns paginated air quality reading history.
 * @param {object} params - { page, limit, offset }
 * @returns {Promise<object>}
 */
async function fetchHistory({ page, limit, offset }) {
  const { rows, total } = await airQualityModel.getHistory({ limit, offset });
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
 * Returns a single air quality reading by its UUID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function fetchById(id) {
  return airQualityModel.getReadingById(id);
}

/**
 * Returns the most recent reading for each distinct floor in a location.
 * @param {string} location
 * @returns {Promise<object[]>}
 */
async function fetchFloorComparison(location) {
  return airQualityModel.getFloorComparison(location);
}

/**
 * Returns the most recent N readings. Used by ML service for sliding window.
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
async function fetchRecentReadings(limit) {
  return airQualityModel.getRecentReadings(limit);
}

// ─── Air Quality Features ────────────────────────────────────────────────────

/**
 * Returns the most recently computed AQI features row.
 * @returns {Promise<object|null>}
 */
async function fetchLatestFeatures() {
  return airFeatureModel.getLatestFeatures();
}

/**
 * Returns paginated air feature history.
 * @param {object} params - { page, limit, offset }
 * @returns {Promise<object>}
 */
async function fetchFeatureHistory({ page, limit, offset }) {
  const { rows, total } = await airFeatureModel.getHistory({ limit, offset });
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

// ─── Air Quality Predictions ─────────────────────────────────────────────────

/**
 * Returns the most recently stored air quality ML prediction.
 * @returns {Promise<object|null>}
 */
async function fetchLatestPrediction() {
  return airPredictionModel.getLatestPrediction();
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
    airQualityModel.getLatestReading(),
    airFeatureModel.getLatestFeatures(),
    airPredictionModel.getLatestPrediction(),
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
  fetchFloorComparison,
  fetchRecentReadings,
  fetchLatestFeatures,
  fetchFeatureHistory,
  fetchLatestPrediction,
  fetchDashboard,
};

