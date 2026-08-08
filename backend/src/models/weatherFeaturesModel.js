const { pool } = require("../config/database");

/**
 * Inserts a computed feature record linked to a weather_readings row.
 *
 * @param {object} params
 * @param {string}  params.weatherReadingId - UUID of the parent weather_readings row
 * @param {string}  params.timestamp        - ISO timestamp (same as parent reading)
 * @param {number|null} params.heatIndex    - Calculated heat index (°C), null when formula N/A
 * @param {number}  params.dewPoint         - Calculated dew point (°C)
 * @param {string}  params.weatherStatus    - Descriptive status string
 * @param {boolean} params.rainAlert        - True when rain threshold exceeded
 * @returns {Promise<object>} The inserted row
 */
async function insertFeatures({
  weatherReadingId,
  timestamp,
  heatIndex,
  dewPoint,
  weatherStatus,
  rainAlert,
}) {
  const query = `
    INSERT INTO weather_features
      (weather_reading_id, timestamp, heat_index, dew_point, weather_status, rain_alert)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      weather_reading_id,
      timestamp,
      heat_index,
      dew_point,
      weather_status,
      rain_alert,
      created_at;
  `;
  const values = [weatherReadingId, timestamp, heatIndex, dewPoint, weatherStatus, rainAlert];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Returns the most recently created weather features row.
 * @returns {Promise<object|null>}
 */
async function getLatestFeatures() {
  const query = `
    SELECT
      id,
      weather_reading_id,
      timestamp,
      heat_index,
      dew_point,
      weather_status,
      rain_alert,
      created_at
    FROM weather_features
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query);
  return rows[0] || null;
}

/**
 * Returns the features record linked to a specific weather_readings UUID.
 * @param {string} readingId - UUID of the parent weather_readings row
 * @returns {Promise<object|null>}
 */
async function getFeaturesByReadingId(readingId) {
  const query = `
    SELECT
      id,
      weather_reading_id,
      timestamp,
      heat_index,
      dew_point,
      weather_status,
      rain_alert,
      created_at
    FROM weather_features
    WHERE weather_reading_id = $1
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [readingId]);
  return rows[0] || null;
}

/**
 * Returns paginated weather feature history with total count.
 * @param {object} params - { limit, offset }
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function getHistory({ limit = 20, offset = 0 } = {}) {
  const dataQuery = `
    SELECT
      id,
      weather_reading_id,
      timestamp,
      heat_index,
      dew_point,
      weather_status,
      rain_alert,
      created_at
    FROM weather_features
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2;
  `;
  const countQuery = `SELECT COUNT(*)::int AS total FROM weather_features;`;

  const [dataRes, countRes] = await Promise.all([
    pool.query(dataQuery, [limit, offset]),
    pool.query(countQuery),
  ]);

  return {
    rows: dataRes.rows,
    total: countRes.rows[0]?.total || 0,
  };
}

module.exports = {
  insertFeatures,
  getLatestFeatures,
  getFeaturesByReadingId,
  getHistory,
};

