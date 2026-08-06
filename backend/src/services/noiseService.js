const noiseModel           = require("../models/noiseModel");
const noiseFeatureModel    = require("../models/noiseFeatureModel");
const noisePredictionModel = require("../models/noisePredictionModel");
const noiseFeatureService  = require("./noiseFeatureService");
const { getIO } = require("../config/socket");

/**
 * Orchestrates the storage and broadcast of incoming noise sensor data.
 *
 * @param {object} payload - Output of validateNoisePayload()
 * @returns {Promise<object|null>}
 */
async function storeAndBroadcastReading(payload) {
  let stored;
  try {
    stored = await noiseModel.insertReading({
      deviceId:     payload.deviceId,
      location:     payload.location,
      timestamp:    payload.timestamp,
      noiseLevelDb: payload.noiseLevelDb,
    });
    console.log(`[DATABASE] Noise reading stored (device: ${stored.device_id})`);
  } catch (err) {
    console.error("[ERROR] Failed to store noise reading:", err.message);
    return null;
  }

  // Broadcast raw reading over Socket.IO
  try {
    const io = getIO();
    io.emit("noise:new", stored);
    console.log("[SOCKET] Emitted noise:new");
  } catch (err) {
    console.error("[ERROR] Failed to emit noise:new:", err.message);
  }

  // Compute and store derived features (non-blocking)
  noiseFeatureService.computeAndStore(stored).then((features) => {
    if (features) {
      try {
        const io = getIO();
        io.emit("noise:features", features);
        console.log("[SOCKET] Emitted noise:features");
      } catch (err) {
        console.error("[ERROR] Failed to emit noise:features:", err.message);
      }
    }
  });

  return stored;
}

// ─── Noise Readings ─────────────────────────────────────────────────────────

async function fetchLatest() {
  return noiseModel.getLatestReading();
}

async function fetchHistory({ page, limit, offset }) {
  const { rows, total } = await noiseModel.getHistory({ limit, offset });
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

async function fetchById(id) {
  return noiseModel.getReadingById(id);
}

async function fetchRecentReadings(limit) {
  return noiseModel.getRecentReadings(limit);
}

// ─── Noise Features ─────────────────────────────────────────────────────────

async function fetchLatestFeatures() {
  return noiseFeatureModel.getLatestFeatures();
}

// ─── Noise Predictions ──────────────────────────────────────────────────────

async function fetchLatestPrediction() {
  return noisePredictionModel.getLatestPrediction();
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

async function fetchDashboard() {
  const [reading, features, prediction] = await Promise.all([
    noiseModel.getLatestReading(),
    noiseFeatureModel.getLatestFeatures(),
    noisePredictionModel.getLatestPrediction(),
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
  fetchRecentReadings,
  fetchLatestFeatures,
  fetchLatestPrediction,
  fetchDashboard,
};
