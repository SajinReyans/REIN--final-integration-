const { pool } = require("../config/database");

/**
 * Air Quality Features Model
 *
 * Manages computed AQI features in air_quality_features. Mirrors the
 * weatherFeaturesModel pattern with air-quality-specific columns.
 */

/**
 * Inserts a computed AQI feature record linked to an air_quality_readings row.
 *
 * @param {object} params
 * @param {string}      params.airReadingId       - UUID of the parent air_quality_readings row
 * @param {string}      params.timestamp          - ISO timestamp (same as parent reading)
 * @param {number|null} params.aqi               - Overall AQI value (0–500)
 * @param {string|null} params.aqiCategory       - Human-readable AQI category string
 * @param {string|null} params.dominantPollutant - Name of the pollutant with highest sub-index
 * @param {number|null} params.airHealthScore    - Composite health score (0–100, higher = better)
 * @param {string[]}    params.airAlerts         - Array of triggered alert strings
 * @returns {Promise<object>} The inserted row
 */
async function insertFeatures({
  airReadingId,
  timestamp,
  aqi,
  aqiCategory,
  dominantPollutant,
  airHealthScore,
  airAlerts,
}) {
  const query = `
    INSERT INTO air_quality_features
      (air_reading_id, timestamp, aqi, aqi_category, dominant_pollutant,
       air_health_score, air_alerts)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id,
      air_reading_id,
      timestamp,
      aqi,
      aqi_category,
      dominant_pollutant,
      air_health_score,
      air_alerts,
      created_at;
  `;
  const values = [
    airReadingId,
    timestamp,
    aqi         ?? null,
    aqiCategory ?? null,
    dominantPollutant ?? null,
    airHealthScore    ?? null,
    JSON.stringify(airAlerts || []),
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Returns the most recently created air quality features row.
 * @returns {Promise<object|null>}
 */
async function getLatestFeatures() {
  const query = `
    SELECT
      id, air_reading_id, timestamp, aqi, aqi_category,
      dominant_pollutant, air_health_score, air_alerts, created_at
    FROM air_quality_features
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query);
  return rows[0] || null;
}

/**
 * Returns the features record linked to a specific air_quality_readings UUID.
 * @param {string} readingId - UUID of the parent air_quality_readings row
 * @returns {Promise<object|null>}
 */
async function getFeaturesByReadingId(readingId) {
  const query = `
    SELECT
      id, air_reading_id, timestamp, aqi, aqi_category,
      dominant_pollutant, air_health_score, air_alerts, created_at
    FROM air_quality_features
    WHERE air_reading_id = $1
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [readingId]);
  return rows[0] || null;
}

/**
 * Returns paginated air quality feature history with total count.
 * @param {object} params - { limit, offset }
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function getHistory({ limit = 20, offset = 0 } = {}) {
  const dataQuery = `
    SELECT
      id, air_reading_id, timestamp, aqi, aqi_category,
      dominant_pollutant, air_health_score, air_alerts, created_at
    FROM air_quality_features
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2;
  `;
  const countQuery = `SELECT COUNT(*)::int AS total FROM air_quality_features;`;

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

