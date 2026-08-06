const { pool } = require("../config/database");

/**
 * Inserts a prediction result from the ML model.
 *
 * @param {object} params
 * @param {string}  params.timestamp               - ISO timestamp when the prediction was generated
 * @param {string}  params.forecastTime            - ISO timestamp for the target forecast period
 * @param {number|null} params.predictedTemperature - Predicted temperature in °C
 * @param {number|null} params.predictedRainfall    - Predicted rainfall in mm
 * @param {string|null} params.predictedWeatherStatus - Predicted weather condition string
 * @param {number|null} params.confidenceScore      - Model confidence (0.0 – 1.0)
 * @param {string|null} params.modelVersion         - Version string of the ML model
 * @returns {Promise<object>} The inserted row
 */
async function insertPrediction({
  timestamp,
  forecastTime,
  predictedTemperature,
  predictedRainfall,
  predictedWeatherStatus,
  confidenceScore,
  modelVersion,
}) {
  const query = `
    INSERT INTO weather_predictions
      (timestamp, forecast_time, predicted_temperature, predicted_rainfall,
       predicted_weather_status, confidence_score, model_version)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id,
      timestamp,
      forecast_time,
      predicted_temperature,
      predicted_rainfall,
      predicted_weather_status,
      confidence_score,
      model_version,
      created_at;
  `;
  const values = [
    timestamp,
    forecastTime,
    predictedTemperature ?? null,
    predictedRainfall ?? null,
    predictedWeatherStatus ?? null,
    confidenceScore ?? null,
    modelVersion ?? null,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Returns the most recently created prediction row.
 * @returns {Promise<object|null>}
 */
async function getLatestPrediction() {
  const query = `
    SELECT
      id,
      timestamp,
      forecast_time,
      predicted_temperature,
      predicted_rainfall,
      predicted_weather_status,
      confidence_score,
      model_version,
      created_at
    FROM weather_predictions
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query);
  return rows[0] || null;
}

/**
 * Returns a paginated list of prediction records, newest first.
 * @param {object} params
 * @param {number} params.limit
 * @param {number} params.offset
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function getPredictionHistory({ limit, offset }) {
  const query = `
    SELECT
      id,
      timestamp,
      forecast_time,
      predicted_temperature,
      predicted_rainfall,
      predicted_weather_status,
      confidence_score,
      model_version,
      created_at
    FROM weather_predictions
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2;
  `;
  const { rows } = await pool.query(query, [limit, offset]);

  const countResult = await pool.query("SELECT COUNT(*)::int AS total FROM weather_predictions;");
  const total = countResult.rows[0].total;

  return { rows, total };
}

module.exports = {
  insertPrediction,
  getLatestPrediction,
  getPredictionHistory,
};
