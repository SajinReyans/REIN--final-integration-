const { pool } = require("../config/database");

/**
 * Air Quality Model
 *
 * Manages per-floor raw sensor readings in air_quality_readings. Joins with
 * building_environment on demand to attach shared temperature/humidity data.
 */

// ─── Insert ───────────────────────────────────────────────────────────────────

/**
 * Inserts a raw per-floor air quality reading.
 *
 * @param {object} params
 * @param {string}      params.deviceId       - Sensor device identifier
 * @param {string}      params.location       - Building/location label
 * @param {string}      params.floorLevel     - Floor identifier (e.g. "bottom", "top")
 * @param {string}      params.timestamp      - ISO timestamp from device
 * @param {number}      params.pm1            - PM1 concentration µg/m³
 * @param {number}      params.pm25           - PM2.5 concentration µg/m³
 * @param {number}      params.pm4            - PM4 concentration µg/m³
 * @param {number}      params.pm10           - PM10 concentration µg/m³
 * @param {number}      params.co2            - CO₂ in ppm
 * @param {number}      params.nox            - NOx in ppb
 * @param {number}      params.voc            - VOC index
 * @param {number}      params.co             - CO in ppm
 * @param {number}      params.o3             - O₃ in ppb
 * @param {string|null} params.buildingEnvId  - UUID FK to building_environment (nullable)
 * @returns {Promise<object>} The inserted row
 */
async function insertReading({
  deviceId,
  location,
  floorLevel,
  timestamp,
  pm1,
  pm25,
  pm4,
  pm10,
  co2,
  nox,
  voc,
  co,
  o3,
  buildingEnvId,
}) {
  const query = `
    INSERT INTO air_quality_readings
      (device_id, location, floor_level, timestamp,
       pm1, pm25, pm4, pm10, co2, nox, voc, co, o3, building_env_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING
      id, device_id, location, floor_level, timestamp,
      pm1, pm25, pm4, pm10, co2, nox, voc, co, o3,
      building_env_id, created_at;
  `;
  const values = [
    deviceId, location, floorLevel, timestamp,
    pm1, pm25, pm4, pm10, co2, nox, voc, co, o3,
    buildingEnvId ?? null,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Returns the most recent reading across all floors, joined with its
 * building environment data.
 * @returns {Promise<object|null>}
 */
async function getLatestReading() {
  const query = `
    SELECT
      r.id, r.device_id, r.location, r.floor_level, r.timestamp,
      r.pm1, r.pm25, r.pm4, r.pm10, r.co2, r.nox, r.voc, r.co, r.o3,
      r.building_env_id, r.created_at,
      e.temperature, e.humidity
    FROM air_quality_readings r
    LEFT JOIN building_environment e ON e.id = r.building_env_id
    ORDER BY r.timestamp DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query);
  return rows[0] || null;
}

/**
 * Returns the most recent reading for a specific floor and location.
 * @param {string} location
 * @param {string} floorLevel
 * @returns {Promise<object|null>}
 */
async function getLatestByFloor(location, floorLevel) {
  const query = `
    SELECT
      r.id, r.device_id, r.location, r.floor_level, r.timestamp,
      r.pm1, r.pm25, r.pm4, r.pm10, r.co2, r.nox, r.voc, r.co, r.o3,
      r.building_env_id, r.created_at,
      e.temperature, e.humidity
    FROM air_quality_readings r
    LEFT JOIN building_environment e ON e.id = r.building_env_id
    WHERE r.location = $1 AND r.floor_level = $2
    ORDER BY r.timestamp DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [location, floorLevel]);
  return rows[0] || null;
}

/**
 * Returns the latest reading per floor for a given location as a side-by-side
 * comparison. Uses DISTINCT ON for an efficient single-pass query.
 *
 * @param {string} location
 * @returns {Promise<object[]>} One row per distinct floor_level, newest first
 */
async function getFloorComparison(location = null) {
  const query = location
    ? `
      SELECT DISTINCT ON (r.floor_level)
        r.id, r.device_id, r.location, r.floor_level, r.timestamp,
        r.pm1, r.pm25, r.pm4, r.pm10, r.co2, r.nox, r.voc, r.co, r.o3,
        r.building_env_id, r.created_at,
        e.temperature, e.humidity
      FROM air_quality_readings r
      LEFT JOIN building_environment e ON e.id = r.building_env_id
      WHERE r.location = $1
      ORDER BY r.floor_level, r.timestamp DESC;
    `
    : `
      SELECT DISTINCT ON (r.floor_level)
        r.id, r.device_id, r.location, r.floor_level, r.timestamp,
        r.pm1, r.pm25, r.pm4, r.pm10, r.co2, r.nox, r.voc, r.co, r.o3,
        r.building_env_id, r.created_at,
        e.temperature, e.humidity
      FROM air_quality_readings r
      LEFT JOIN building_environment e ON e.id = r.building_env_id
      ORDER BY r.floor_level, r.timestamp DESC;
    `;
  const values = location ? [location] : [];
  const { rows } = await pool.query(query, values);
  return rows;
}

/**
 * Returns paginated readings (newest first), joined with environment data.
 * @param {object} params
 * @param {number} params.limit
 * @param {number} params.offset
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function getHistory({ limit, offset }) {
  const query = `
    SELECT
      r.id, r.device_id, r.location, r.floor_level, r.timestamp,
      r.pm1, r.pm25, r.pm4, r.pm10, r.co2, r.nox, r.voc, r.co, r.o3,
      r.building_env_id, r.created_at,
      e.temperature, e.humidity
    FROM air_quality_readings r
    LEFT JOIN building_environment e ON e.id = r.building_env_id
    ORDER BY r.timestamp DESC
    LIMIT $1 OFFSET $2;
  `;
  const { rows } = await pool.query(query, [limit, offset]);

  const countResult = await pool.query("SELECT COUNT(*)::int AS total FROM air_quality_readings;");
  const total = countResult.rows[0].total;

  return { rows, total };
}

/**
 * Returns a single reading by UUID, joined with environment data.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function getReadingById(id) {
  const query = `
    SELECT
      r.id, r.device_id, r.location, r.floor_level, r.timestamp,
      r.pm1, r.pm25, r.pm4, r.pm10, r.co2, r.nox, r.voc, r.co, r.o3,
      r.building_env_id, r.created_at,
      e.temperature, e.humidity
    FROM air_quality_readings r
    LEFT JOIN building_environment e ON e.id = r.building_env_id
    WHERE r.id = $1;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

/**
 * Returns the most recent N readings joined with environment data.
 * Used by the external ML model to retrieve a sliding window of data.
 *
 * @param {number} [limit=50]
 * @returns {Promise<object[]>}
 */
async function getRecentReadings(limit = 50) {
  const query = `
    SELECT
      r.id, r.device_id, r.location, r.floor_level, r.timestamp,
      r.pm1, r.pm25, r.pm4, r.pm10, r.co2, r.nox, r.voc, r.co, r.o3,
      r.building_env_id, r.created_at,
      e.temperature, e.humidity
    FROM air_quality_readings r
    LEFT JOIN building_environment e ON e.id = r.building_env_id
    ORDER BY r.timestamp DESC
    LIMIT $1;
  `;
  const { rows } = await pool.query(query, [limit]);
  return rows;
}

module.exports = {
  insertReading,
  getLatestReading,
  getLatestByFloor,
  getFloorComparison,
  getHistory,
  getReadingById,
  getRecentReadings,
};
