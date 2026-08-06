const { pool } = require("../config/database");

/**
 * Noise Features Model
 *
 * Manages computed noise features in noise_features.
 */

/**
 * Inserts a computed noise feature record linked to a noise_readings row.
 *
 * @param {object} params
 * @param {string}   params.noiseReadingId   - UUID of the parent noise_readings row
 * @param {string}   params.timestamp        - ISO timestamp (same as parent reading)
 * @param {string}   params.noiseStatus      - e.g., 'Quiet / Optimal'
 * @param {string}   params.noiseCategory    - 'Low', 'Moderate', or 'High'
 * @param {string[]} params.noiseAlerts      - Array of triggered alert strings
 * @param {number}   params.noiseHealthScore - Composite health score (0-100)
 * @returns {Promise<object>} The inserted row
 */
async function insertFeatures({
  noiseReadingId,
  timestamp,
  noiseStatus,
  noiseCategory,
  noiseAlerts,
  noiseHealthScore,
}) {
  const query = `
    INSERT INTO noise_features
      (noise_reading_id, timestamp, noise_status, noise_category, noise_alerts, noise_health_score)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      noise_reading_id,
      timestamp,
      noise_status,
      noise_category,
      noise_alerts,
      noise_health_score,
      created_at;
  `;
  const values = [
    noiseReadingId,
    timestamp,
    noiseStatus      ?? null,
    noiseCategory    ?? null,
    JSON.stringify(noiseAlerts || []),
    noiseHealthScore ?? null,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Returns the most recently created noise features row.
 * @returns {Promise<object|null>}
 */
async function getLatestFeatures() {
  const query = `
    SELECT
      id, noise_reading_id, timestamp, noise_status, noise_category,
      noise_alerts, noise_health_score, created_at
    FROM noise_features
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query);
  return rows[0] || null;
}

/**
 * Returns the features record linked to a specific noise_readings UUID.
 * @param {string} readingId
 * @returns {Promise<object|null>}
 */
async function getFeaturesByReadingId(readingId) {
  const query = `
    SELECT
      id, noise_reading_id, timestamp, noise_status, noise_category,
      noise_alerts, noise_health_score, created_at
    FROM noise_features
    WHERE noise_reading_id = $1
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [readingId]);
  return rows[0] || null;
}

module.exports = {
  insertFeatures,
  getLatestFeatures,
  getFeaturesByReadingId,
};
