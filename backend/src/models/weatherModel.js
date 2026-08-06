const { pool } = require("../config/database");

/**
 * Inserts a raw sensor reading from the ESP32 device.
 *
 * @param {object} params
 * @param {string}  params.deviceId      - ESP32 device identifier
 * @param {string}  params.location      - Physical location label
 * @param {string}  params.timestamp     - ISO timestamp from device
 * @param {number}  params.temperature   - Temperature in °C
 * @param {number}  params.humidity      - Relative humidity %
 * @param {number}  params.rainfall      - Rainfall in mm
 * @param {number}  params.windSpeed     - Wind speed in m/s
 * @param {number}  params.windDirection - Wind direction in degrees (0–360)
 * @returns {Promise<object>} The inserted row
 */
async function insertReading({
  deviceId,
  location,
  timestamp,
  temperature,
  humidity,
  rainfall,
  windSpeed,
  windDirection,
}) {
  const query = `
    INSERT INTO weather_readings
      (device_id, location, timestamp, temperature, humidity, rainfall, wind_speed, wind_direction)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING
      id,
      device_id,
      location,
      timestamp,
      temperature,
      humidity,
      rainfall,
      wind_speed,
      wind_direction,
      created_at;
  `;
  const values = [deviceId, location, timestamp, temperature, humidity, rainfall, windSpeed, windDirection];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Returns the most recent weather reading.
 * @returns {Promise<object|null>}
 */
async function getLatestReading() {
  const query = `
    SELECT
      id, device_id, location, timestamp,
      temperature, humidity, rainfall, wind_speed, wind_direction, created_at
    FROM weather_readings
    ORDER BY timestamp DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query);
  return rows[0] || null;
}

/**
 * Returns paginated weather readings, newest first.
 * @param {object} params
 * @param {number} params.limit
 * @param {number} params.offset
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function getHistory({ limit, offset }) {
  const query = `
    SELECT
      id, device_id, location, timestamp,
      temperature, humidity, rainfall, wind_speed, wind_direction, created_at
    FROM weather_readings
    ORDER BY timestamp DESC
    LIMIT $1 OFFSET $2;
  `;
  const { rows } = await pool.query(query, [limit, offset]);

  const countResult = await pool.query("SELECT COUNT(*)::int AS total FROM weather_readings;");
  const total = countResult.rows[0].total;

  return { rows, total };
}

/**
 * Returns a single reading by its UUID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function getReadingById(id) {
  const query = `
    SELECT
      id, device_id, location, timestamp,
      temperature, humidity, rainfall, wind_speed, wind_direction, created_at
    FROM weather_readings
    WHERE id = $1;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

/**
 * Returns aggregate statistics across all readings.
 * @returns {Promise<object>}
 */
async function getStats() {
  const query = `
    SELECT
      ROUND(AVG(temperature)::numeric,   2) AS avg_temperature,
      ROUND(AVG(humidity)::numeric,      2) AS avg_humidity,
      ROUND(AVG(rainfall)::numeric,      2) AS avg_rainfall,
      ROUND(AVG(wind_speed)::numeric,    2) AS avg_wind_speed,
      ROUND(SUM(rainfall)::numeric,      2) AS total_rainfall,
      MIN(temperature)                      AS min_temperature,
      MAX(temperature)                      AS max_temperature,
      MIN(humidity)                         AS min_humidity,
      MAX(humidity)                         AS max_humidity,
      COUNT(*)::int                         AS reading_count
    FROM weather_readings;
  `;
  const { rows } = await pool.query(query);
  return rows[0];
}

module.exports = {
  insertReading,
  getLatestReading,
  getHistory,
  getReadingById,
  getStats,
};
