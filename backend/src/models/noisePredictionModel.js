const { pool } = require("../config/database");

/**
 * Noise Predictions Model
 *
 * Manages ML prediction results for noise forecasting.
 */

/**
 * Inserts a noise ML prediction result.
 *
 * @param {object} params
 * @param {string}      params.timestamp                - ISO timestamp when prediction was generated
 * @param {string}      params.forecastTime             - ISO timestamp for the target forecast period
 * @param {number|null} params.predictedNoiseLevel      - Predicted noise level in dB
 * @param {string|null} params.predictedNoiseCategory   - Predicted noise category ('Low', 'Moderate', 'High')
 * @param {number|null} params.confidenceScore          - Model confidence (0.0 – 1.0)
 * @param {string|null} params.modelVersion             - Model version string
 * @returns {Promise<object>} The inserted row
 */
async function insertPrediction({
  timestamp,
  forecastTime,
  predictedNoiseLevel,
  predictedNoiseCategory,
  confidenceScore,
  modelVersion,
}) {
  const query = `
    INSERT INTO noise_predictions
      (timestamp, forecast_time, predicted_noise_level, predicted_noise_category,
       confidence_score, model_version)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      timestamp,
      forecast_time,
      predicted_noise_level,
      predicted_noise_category,
      confidence_score,
      model_version,
      created_at;
  `;
  const values = [
    timestamp,
    forecastTime,
    predictedNoiseLevel      ?? null,
    predictedNoiseCategory   ?? null,
    confidenceScore          ?? null,
    modelVersion             ?? null,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Returns the most recently created noise prediction row.
 * @returns {Promise<object|null>}
 */
async function getLatestPrediction() {
  const query = `
    SELECT
      id, timestamp, forecast_time, predicted_noise_level, predicted_noise_category,
      confidence_score, model_version, created_at
    FROM noise_predictions
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query);
  return rows[0] || null;
}

/**
 * Returns a paginated list of noise prediction records, newest first.
 * @param {object} params
 * @param {number} params.limit
 * @param {number} params.offset
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function getPredictionHistory({ limit, offset }) {
  const query = `
    SELECT
      id, timestamp, forecast_time, predicted_noise_level, predicted_noise_category,
      confidence_score, model_version, created_at
    FROM noise_predictions
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2;
  `;
  const { rows } = await pool.query(query, [limit, offset]);

  const countResult = await pool.query("SELECT COUNT(*)::int AS total FROM noise_predictions;");
  const total = countResult.rows[0].total;

  return { rows, total };
}

module.exports = {
  insertPrediction,
  getLatestPrediction,
  getPredictionHistory,
};
