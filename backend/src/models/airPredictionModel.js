const { pool } = require("../config/database");

/**
 * Air Quality Predictions Model
 *
 * Manages XGBoost + LightGBM ensemble prediction results in
 * air_quality_predictions. Mirrors weatherPredictionsModel with
 * air-quality-specific prediction fields.
 */

/**
 * Inserts an air quality ML prediction result.
 *
 * @param {object} params
 * @param {string}      params.timestamp                  - ISO timestamp when prediction was generated
 * @param {string}      params.forecastTime               - ISO timestamp for the target forecast period
 * @param {number|null} params.predictedAqi               - Predicted AQI value
 * @param {string|null} params.predictedAqiCategory       - Predicted AQI category string
 * @param {string|null} params.predictedDominantPollutant - Predicted dominant pollutant
 * @param {number|null} params.confidenceScore            - Model confidence (0.0 – 1.0)
 * @param {string|null} params.modelVersion               - Ensemble model version string
 * @returns {Promise<object>} The inserted row
 */
async function insertPrediction({
  timestamp,
  forecastTime,
  predictedAqi,
  predictedAqiCategory,
  predictedDominantPollutant,
  confidenceScore,
  modelVersion,
}) {
  const query = `
    INSERT INTO air_quality_predictions
      (timestamp, forecast_time, predicted_aqi, predicted_aqi_category,
       predicted_dominant_pollutant, confidence_score, model_version)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id,
      timestamp,
      forecast_time,
      predicted_aqi,
      predicted_aqi_category,
      predicted_dominant_pollutant,
      confidence_score,
      model_version,
      created_at;
  `;
  const values = [
    timestamp,
    forecastTime,
    predictedAqi               ?? null,
    predictedAqiCategory       ?? null,
    predictedDominantPollutant ?? null,
    confidenceScore            ?? null,
    modelVersion               ?? null,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Returns the most recently created air quality prediction row.
 * @returns {Promise<object|null>}
 */
async function getLatestPrediction() {
  const query = `
    SELECT
      id, timestamp, forecast_time, predicted_aqi, predicted_aqi_category,
      predicted_dominant_pollutant, confidence_score, model_version, created_at
    FROM air_quality_predictions
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query);
  return rows[0] || null;
}

/**
 * Returns a paginated list of air quality prediction records, newest first.
 * @param {object} params
 * @param {number} params.limit
 * @param {number} params.offset
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function getPredictionHistory({ limit, offset }) {
  const query = `
    SELECT
      id, timestamp, forecast_time, predicted_aqi, predicted_aqi_category,
      predicted_dominant_pollutant, confidence_score, model_version, created_at
    FROM air_quality_predictions
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2;
  `;
  const { rows } = await pool.query(query, [limit, offset]);

  const countResult = await pool.query("SELECT COUNT(*)::int AS total FROM air_quality_predictions;");
  const total = countResult.rows[0].total;

  return { rows, total };
}

module.exports = {
  insertPrediction,
  getLatestPrediction,
  getPredictionHistory,
};
