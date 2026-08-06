/**
 * Prediction Service
 *
 * Handles storage and retrieval of ML model forecast results.
 * The ML model pushes predictions to POST /api/predictions; this service
 * validates the payload and delegates to the predictions model.
 */

const weatherPredictionsModel = require("../models/weatherPredictionsModel");

/**
 * Validates and stores an ML prediction payload.
 *
 * Required fields:
 *   timestamp    — ISO timestamp of when the prediction was generated
 *   forecastTime — ISO timestamp for the target forecast period
 *
 * Optional fields (all stored as-is, nulls allowed):
 *   predictedTemperature, predictedRainfall, predictedWeatherStatus,
 *   confidenceScore (0–1), modelVersion
 *
 * @param {object} payload - Raw request body from the ML model
 * @returns {Promise<{ ok: boolean, errors?: string[], data?: object }>}
 */
async function storePrediction(payload) {
  const errors = [];

  if (!payload || typeof payload !== "object") {
    return { ok: false, errors: ["Payload must be a JSON object"] };
  }

  const {
    timestamp,
    forecastTime,
    predictedTemperature,
    predictedRainfall,
    predictedWeatherStatus,
    confidenceScore,
    modelVersion,
  } = payload;

  // ── Required fields ───────────────────────────────────────────────────────
  if (typeof timestamp !== "string" || Number.isNaN(Date.parse(timestamp))) {
    errors.push("timestamp is required and must be a valid ISO 8601 timestamp");
  }
  if (typeof forecastTime !== "string" || Number.isNaN(Date.parse(forecastTime))) {
    errors.push("forecastTime is required and must be a valid ISO 8601 timestamp");
  }

  // ── Optional numeric fields ───────────────────────────────────────────────
  if (predictedTemperature !== undefined && predictedTemperature !== null) {
    if (typeof predictedTemperature !== "number" || Number.isNaN(predictedTemperature)) {
      errors.push("predictedTemperature must be a number");
    }
  }
  if (predictedRainfall !== undefined && predictedRainfall !== null) {
    if (typeof predictedRainfall !== "number" || Number.isNaN(predictedRainfall) || predictedRainfall < 0) {
      errors.push("predictedRainfall must be a non-negative number");
    }
  }
  if (confidenceScore !== undefined && confidenceScore !== null) {
    if (typeof confidenceScore !== "number" || confidenceScore < 0 || confidenceScore > 1) {
      errors.push("confidenceScore must be a number between 0 and 1");
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  try {
    const stored = await weatherPredictionsModel.insertPrediction({
      timestamp,
      forecastTime,
      predictedTemperature:    predictedTemperature    ?? null,
      predictedRainfall:       predictedRainfall       ?? null,
      predictedWeatherStatus:  predictedWeatherStatus  ?? null,
      confidenceScore:         confidenceScore         ?? null,
      modelVersion:            modelVersion            ?? null,
    });

    console.log(`[PREDICTIONS] Stored prediction (id: ${stored.id}, model: ${stored.model_version})`);
    return { ok: true, data: stored };
  } catch (err) {
    console.error("[ERROR] Failed to store prediction:", err.message);
    throw err; // re-throw so the controller returns 500
  }
}

/**
 * Returns the most recently created prediction.
 * @returns {Promise<object|null>}
 */
async function fetchLatestPrediction() {
  return weatherPredictionsModel.getLatestPrediction();
}

/**
 * Returns a paginated list of prediction records.
 * @param {object} params
 * @param {number} params.page
 * @param {number} params.limit
 * @param {number} params.offset
 * @returns {Promise<object>}
 */
async function fetchPredictionHistory({ page, limit, offset }) {
  const { rows, total } = await weatherPredictionsModel.getPredictionHistory({ limit, offset });
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

module.exports = {
  storePrediction,
  fetchLatestPrediction,
  fetchPredictionHistory,
};
