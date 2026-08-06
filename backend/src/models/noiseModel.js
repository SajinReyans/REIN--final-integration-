const { pool } = require("../config/database");

/**
 * Noise Model
 *
 * Manages raw noise sensor readings in noise_readings.
 */

/**
 * Inserts a raw noise reading.
 *
 * @param {object} params
 * @param {string} params.deviceId     - Sensor device identifier
 * @param {string} params.location     - Building/location label
 * @param {string} params.timestamp    - ISO timestamp from device
 * @param {number} params.noiseLevelDb - Noise level in dB
 * @returns {Promise<object>} The inserted row
 */
async function insertReading({
  deviceId,
  location,
  timestamp,
  noiseLevelDb,
}) {
  const query = `
    INSERT INTO noise_readings
      (device_id, location, timestamp, noise_level_db)
    VALUES ($1, $2, $3, $4)
    RETURNING
      id, device_id, location, timestamp, noise_level_db, created_at;
  `;
  const values = [deviceId, location, timestamp, noiseLevelDb];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Returns the most recent noise reading.
 * @returns {Promise<object|null>}
 */
async function getLatestReading() {
  const query = `
    SELECT id, device_id, location, timestamp, noise_level_db, created_at
    FROM noise_readings
    ORDER BY timestamp DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query);
  return rows[0] || null;
}

/**
 * Returns paginated noise readings (newest first).
 * @param {object} params
 * @param {number} params.limit
 * @param {number} params.offset
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function getHistory({ limit, offset }) {
  const query = `
    SELECT id, device_id, location, timestamp, noise_level_db, created_at
    FROM noise_readings
    ORDER BY timestamp DESC
    LIMIT $1 OFFSET $2;
  `;
  const { rows } = await pool.query(query, [limit, offset]);

  const countResult = await pool.query("SELECT COUNT(*)::int AS total FROM noise_readings;");
  const total = countResult.rows[0].total;

  return { rows, total };
}

/**
 * Returns a single noise reading by UUID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function getReadingById(id) {
  const query = `
    SELECT id, device_id, location, timestamp, noise_level_db, created_at
    FROM noise_readings
    WHERE id = $1;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

/**
 * Returns the most recent N noise readings. Used by external ML service.
 * @param {number} [limit=50]
 * @returns {Promise<object[]>}
 */
async function getRecentReadings(limit = 50) {
  const query = `
    SELECT id, device_id, location, timestamp, noise_level_db, created_at
    FROM noise_readings
    ORDER BY timestamp DESC
    LIMIT $1;
  `;
  const { rows } = await pool.query(query, [limit]);
  return rows;
}

module.exports = {
  insertReading,
  getLatestReading,
  getHistory,
  getReadingById,
  getRecentReadings,
};
