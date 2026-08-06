/**
 * Noise Prediction Service
 *
 * Handles storage and retrieval of XGBoost + LightGBM ensemble prediction
 * results for noise forecasting.
 */

const noisePredictionModel = require("../models/noisePredictionModel");

/**
 * Validates and stores a noise ML prediction payload.
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
    predictedNoiseLevel,
    predictedNoiseCategory,
    confidenceScore,
    modelVersion,
  } = payload;

  if (typeof timestamp !== "string" || Number.isNaN(Date.parse(timestamp))) {
    errors.push("timestamp is required and must be a valid ISO 8601 timestamp");
  }
  if (typeof forecastTime !== "string" || Number.isNaN(Date.parse(forecastTime))) {
    errors.push("forecastTime is required and must be a valid ISO 8601 timestamp");
  }

  if (predictedNoiseLevel !== undefined && predictedNoiseLevel !== null) {
    if (typeof predictedNoiseLevel !== "number" || Number.isNaN(predictedNoiseLevel) || predictedNoiseLevel < 0) {
      errors.push("predictedNoiseLevel must be a non-negative number");
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
    const stored = await noisePredictionModel.insertPrediction({
      timestamp,
      forecastTime,
      predictedNoiseLevel:    predictedNoiseLevel    ?? null,
      predictedNoiseCategory: predictedNoiseCategory ?? null,
      confidenceScore:        confidenceScore        ?? null,
      modelVersion:           modelVersion           ?? null,
    });

    console.log(`[NOISE-PREDICTIONS] Stored prediction (id: ${stored.id}, model: ${stored.model_version})`);
    return { ok: true, data: stored };
  } catch (err) {
    console.error("[ERROR] Failed to store noise prediction:", err.message);
    throw err;
  }
}

/**
 * Returns the most recently stored noise prediction.
 * @returns {Promise<object|null>}
 */
async function fetchLatestPrediction() {
  return noisePredictionModel.getLatestPrediction();
}

/**
 * Returns a paginated list of noise prediction records.
 * @param {object} params
 * @param {number} params.page
 * @param {number} params.limit
 * @param {number} params.offset
 * @returns {Promise<object>}
 */
async function fetchPredictionHistory({ page, limit, offset }) {
  const { rows, total } = await noisePredictionModel.getPredictionHistory({ limit, offset });
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
