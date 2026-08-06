const { pool } = require("../config/database");

/**
 * Building Environment Model
 *
 * Manages shared temperature/humidity records that represent building-level
 * environmental conditions. A single record is reused by all floor sensors
 * within a configurable time window, preventing duplicate storage of the
 * same environmental data.
 */

// ─── Upsert (find-or-create within time window) ───────────────────────────────

/**
 * Finds an existing building_environment record for a location within the
 * given time window, or creates a new one if none exists.
 *
 * Both floor sensors sending temp/humidity will resolve to the same row as
 * long as their readings arrive within `windowMinutes` of each other.
 *
 * @param {object} params
 * @param {string}  params.location       - Building/location identifier
 * @param {string}  params.timestamp      - ISO timestamp from the sensor
 * @param {number}  params.temperature    - Temperature in °C
 * @param {number}  params.humidity       - Relative humidity %
 * @param {number}  [params.windowMinutes=10] - Deduplication window in minutes
 * @returns {Promise<object>} The found or newly created row
 */
async function upsertEnvironment({
  location,
  timestamp,
  temperature,
  humidity,
  windowMinutes = 10,
}) {
  // Look for a record created within the window for this location
  const findQuery = `
    SELECT id, location, timestamp, temperature, humidity, created_at
    FROM building_environment
    WHERE location = $1
      AND created_at >= NOW() - ($2 || ' minutes')::INTERVAL
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows: existing } = await pool.query(findQuery, [location, windowMinutes]);

  if (existing.length > 0) {
    return existing[0]; // reuse — do not create a duplicate
  }

  // No record found in the window — create a new one
  const insertQuery = `
    INSERT INTO building_environment (location, timestamp, temperature, humidity)
    VALUES ($1, $2, $3, $4)
    RETURNING id, location, timestamp, temperature, humidity, created_at;
  `;
  const { rows } = await pool.query(insertQuery, [location, timestamp, temperature, humidity]);
  return rows[0];
}

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Returns the most recent building_environment record for a given location.
 * @param {string} location
 * @returns {Promise<object|null>}
 */
async function getLatestForLocation(location) {
  const query = `
    SELECT id, location, timestamp, temperature, humidity, created_at
    FROM building_environment
    WHERE location = $1
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [location]);
  return rows[0] || null;
}

/**
 * Returns building_environment records for a location within a rolling window.
 * Used by floor sensors that don't report temp/humidity to find the nearest
 * available environmental record.
 *
 * @param {string} location
 * @param {number} [windowMinutes=60]
 * @returns {Promise<object[]>}
 */
async function getRecentForLocation(location, windowMinutes = 60) {
  const query = `
    SELECT id, location, timestamp, temperature, humidity, created_at
    FROM building_environment
    WHERE location = $1
      AND created_at >= NOW() - ($2 || ' minutes')::INTERVAL
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(query, [location, windowMinutes]);
  return rows;
}

module.exports = {
  upsertEnvironment,
  getLatestForLocation,
  getRecentForLocation,
};
