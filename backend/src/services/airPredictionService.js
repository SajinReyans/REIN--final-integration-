/**
 * Air Quality Prediction Service
 *
 * Handles storage and retrieval of XGBoost + LightGBM ensemble prediction
 * results for air quality forecasting. Mirrors the weather predictionService
 * pattern with air-quality-specific fields.
 *
 * The external ML model:
 *   1. Pulls a sliding window via GET /api/air/readings/recent?limit=N
 *   2. Computes a prediction using XGBoost + LightGBM ensemble
 *   3. POSTs the result to POST /api/air/predictions
 * This service validates and stores those results.
 */

const airPredictionModel = require("../models/airPredictionModel");

/**
 * Validates and stores an air quality ML prediction payload.
 *
 * Required fields:
 *   timestamp    — ISO timestamp of when the prediction was generated
 *   forecastTime — ISO timestamp for the target forecast period
 *
 * Optional fields (nulls allowed):
 *   predictedAqi, predictedAqiCategory, predictedDominantPollutant,
 *   confidenceScore (0–1), modelVersion
 *
 * @param {object} payload - Raw request body from the ML service
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
    predictedAqi,
    predictedAqiCategory,
    predictedDominantPollutant,
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
  if (predictedAqi !== undefined && predictedAqi !== null) {
    if (typeof predictedAqi !== "number" || Number.isNaN(predictedAqi) || predictedAqi < 0) {
      errors.push("predictedAqi must be a non-negative number");
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
    const stored = await airPredictionModel.insertPrediction({
      timestamp,
      forecastTime,
      predictedAqi:               predictedAqi               ?? null,
      predictedAqiCategory:       predictedAqiCategory       ?? null,
      predictedDominantPollutant: predictedDominantPollutant ?? null,
      confidenceScore:            confidenceScore            ?? null,
      modelVersion:               modelVersion               ?? null,
    });

    console.log(`[AQ-PREDICTIONS] Stored prediction (id: ${stored.id}, model: ${stored.model_version})`);
    return { ok: true, data: stored };
  } catch (err) {
    console.error("[ERROR] Failed to store air quality prediction:", err.message);
    throw err; // re-throw so the controller returns 500
  }
}

/**
 * Returns the most recently stored air quality prediction.
 * @returns {Promise<object|null>}
 */
async function fetchLatestPrediction() {
  return airPredictionModel.getLatestPrediction();
}

/**
 * Returns a paginated list of air quality prediction records.
 * @param {object} params
 * @param {number} params.page
 * @param {number} params.limit
 * @param {number} params.offset
 * @returns {Promise<object>}
 */
async function fetchPredictionHistory({ page, limit, offset }) {
  const { rows, total } = await airPredictionModel.getPredictionHistory({ limit, offset });
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
