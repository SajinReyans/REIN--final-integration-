const { pool } = require("../config/database");

/**
 * Initializes all database tables (weather, air quality, noise) and their
 * supporting indexes. Safe to run on every server start — all DDL uses
 * IF NOT EXISTS and will NEVER drop or truncate existing data.
 *
 * Weather tables (3):
 *   1. weather_readings
 *   2. weather_features
 *   3. weather_predictions
 *
 * Air Quality tables (4):
 *   4. building_environment
 *   5. air_quality_readings
 *   6. air_quality_features
 *   7. air_quality_predictions
 *
 * Noise tables (3):
 *   8. noise_readings
 *   9. noise_features
 *  10. noise_predictions
 */
async function initDatabase() {
  const createExtension = `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;

  // ══════════════════════════════════════════════════════════════════════════
  // WEATHER MODULE
  // ══════════════════════════════════════════════════════════════════════════

  const createWeatherReadingsTable = `
    CREATE TABLE IF NOT EXISTS weather_readings (
      id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id      VARCHAR(100) NOT NULL,
      location       VARCHAR(255) NOT NULL DEFAULT '',
      timestamp      TIMESTAMPTZ  NOT NULL,
      temperature    NUMERIC(5,2) NOT NULL CHECK (temperature >= -50 AND temperature <= 100),
      humidity       NUMERIC(5,2) NOT NULL CHECK (humidity >= 0 AND humidity <= 100),
      rainfall       NUMERIC(8,2) NOT NULL CHECK (rainfall >= 0 AND rainfall <= 1000),
      wind_speed     NUMERIC(6,2) NOT NULL CHECK (wind_speed >= 0 AND wind_speed <= 200),
      wind_direction NUMERIC(5,2) NOT NULL CHECK (wind_direction >= 0 AND wind_direction <= 360),
      created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `;

  const createWeatherReadingsIndexes = `
    CREATE INDEX IF NOT EXISTS idx_readings_timestamp   ON weather_readings (timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_readings_device_id   ON weather_readings (device_id);
    CREATE INDEX IF NOT EXISTS idx_readings_created_at  ON weather_readings (created_at DESC);
  `;

  const createWeatherFeaturesTable = `
    CREATE TABLE IF NOT EXISTS weather_features (
      id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      weather_reading_id UUID        NOT NULL REFERENCES weather_readings(id) ON DELETE CASCADE,
      timestamp          TIMESTAMPTZ NOT NULL,
      heat_index         NUMERIC(5,2),
      dew_point          NUMERIC(5,2),
      weather_status     VARCHAR(50) NOT NULL DEFAULT 'Unknown',
      rain_alert         BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  const createWeatherFeaturesIndexes = `
    CREATE INDEX IF NOT EXISTS idx_features_reading_id  ON weather_features (weather_reading_id);
    CREATE INDEX IF NOT EXISTS idx_features_timestamp   ON weather_features (timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_features_created_at  ON weather_features (created_at DESC);
  `;

  const createWeatherPredictionsTable = `
    CREATE TABLE IF NOT EXISTS weather_predictions (
      id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      timestamp                TIMESTAMPTZ NOT NULL,
      forecast_time            TIMESTAMPTZ NOT NULL,
      predicted_temperature    NUMERIC(5,2),
      predicted_rainfall       NUMERIC(8,2),
      predicted_weather_status VARCHAR(50),
      confidence_score         NUMERIC(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
      model_version            VARCHAR(50),
      created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  const createWeatherPredictionsIndexes = `
    CREATE INDEX IF NOT EXISTS idx_predictions_timestamp     ON weather_predictions (timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_predictions_forecast_time ON weather_predictions (forecast_time DESC);
    CREATE INDEX IF NOT EXISTS idx_predictions_created_at   ON weather_predictions (created_at DESC);
  `;

  // ══════════════════════════════════════════════════════════════════════════
  // AIR QUALITY MODULE
  // ══════════════════════════════════════════════════════════════════════════

  const createBuildingEnvTable = `
    CREATE TABLE IF NOT EXISTS building_environment (
      id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      location    VARCHAR(255) NOT NULL,
      timestamp   TIMESTAMPTZ  NOT NULL,
      temperature NUMERIC(5,2) NOT NULL CHECK (temperature >= -50 AND temperature <= 100),
      humidity    NUMERIC(5,2) NOT NULL CHECK (humidity >= 0 AND humidity <= 100),
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `;

  const createBuildingEnvIndexes = `
    CREATE INDEX IF NOT EXISTS idx_building_env_location   ON building_environment (location);
    CREATE INDEX IF NOT EXISTS idx_building_env_timestamp  ON building_environment (timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_building_env_created_at ON building_environment (created_at DESC);
  `;

  const createAqReadingsTable = `
    CREATE TABLE IF NOT EXISTS air_quality_readings (
      id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id       VARCHAR(100) NOT NULL,
      location        VARCHAR(255) NOT NULL,
      floor_level     VARCHAR(50)  NOT NULL,
      timestamp       TIMESTAMPTZ  NOT NULL,
      pm1             NUMERIC(8,2) NOT NULL CHECK (pm1  >= 0 AND pm1  <= 1000),
      pm25            NUMERIC(8,2) NOT NULL CHECK (pm25 >= 0 AND pm25 <= 1000),
      pm4             NUMERIC(8,2) NOT NULL CHECK (pm4  >= 0 AND pm4  <= 1000),
      pm10            NUMERIC(8,2) NOT NULL CHECK (pm10 >= 0 AND pm10 <= 1000),
      co2             NUMERIC(8,2) NOT NULL CHECK (co2  >= 0 AND co2  <= 10000),
      nox             NUMERIC(8,2) NOT NULL CHECK (nox  >= 0 AND nox  <= 2000),
      voc             NUMERIC(8,2) NOT NULL CHECK (voc  >= 0 AND voc  <= 500),
      co              NUMERIC(8,2) NOT NULL CHECK (co   >= 0 AND co   <= 100),
      o3              NUMERIC(8,2) NOT NULL CHECK (o3   >= 0 AND o3   <= 600),
      building_env_id UUID         REFERENCES building_environment(id) ON DELETE SET NULL,
      created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `;

  const createAqReadingsIndexes = `
    CREATE INDEX IF NOT EXISTS idx_aq_readings_timestamp   ON air_quality_readings (timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_aq_readings_device_id   ON air_quality_readings (device_id);
    CREATE INDEX IF NOT EXISTS idx_aq_readings_location    ON air_quality_readings (location);
    CREATE INDEX IF NOT EXISTS idx_aq_readings_floor       ON air_quality_readings (location, floor_level);
    CREATE INDEX IF NOT EXISTS idx_aq_readings_env_id      ON air_quality_readings (building_env_id);
    CREATE INDEX IF NOT EXISTS idx_aq_readings_created_at  ON air_quality_readings (created_at DESC);
  `;

  const createAqFeaturesTable = `
    CREATE TABLE IF NOT EXISTS air_quality_features (
      id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      air_reading_id     UUID         NOT NULL REFERENCES air_quality_readings(id) ON DELETE CASCADE,
      timestamp          TIMESTAMPTZ  NOT NULL,
      aqi                NUMERIC(6,2),
      aqi_category       VARCHAR(100),
      dominant_pollutant VARCHAR(50),
      air_health_score   NUMERIC(5,2),
      air_alerts         JSONB        NOT NULL DEFAULT '[]',
      created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `;

  const createAqFeaturesIndexes = `
    CREATE INDEX IF NOT EXISTS idx_aq_features_reading_id  ON air_quality_features (air_reading_id);
    CREATE INDEX IF NOT EXISTS idx_aq_features_timestamp   ON air_quality_features (timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_aq_features_created_at  ON air_quality_features (created_at DESC);
  `;

  const createAqPredictionsTable = `
    CREATE TABLE IF NOT EXISTS air_quality_predictions (
      id                           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      timestamp                    TIMESTAMPTZ  NOT NULL,
      forecast_time                TIMESTAMPTZ  NOT NULL,
      predicted_aqi                NUMERIC(6,2),
      predicted_aqi_category       VARCHAR(100),
      predicted_dominant_pollutant VARCHAR(50),
      confidence_score             NUMERIC(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
      model_version                VARCHAR(50),
      created_at                   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `;

  const createAqPredictionsIndexes = `
    CREATE INDEX IF NOT EXISTS idx_aq_predictions_timestamp     ON air_quality_predictions (timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_aq_predictions_forecast_time ON air_quality_predictions (forecast_time DESC);
    CREATE INDEX IF NOT EXISTS idx_aq_predictions_created_at   ON air_quality_predictions (created_at DESC);
  `;

  // ══════════════════════════════════════════════════════════════════════════
  // NOISE MODULE
  // ══════════════════════════════════════════════════════════════════════════

  const createNoiseReadingsTable = `
    CREATE TABLE IF NOT EXISTS noise_readings (
      id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id      VARCHAR(100) NOT NULL,
      location       VARCHAR(255) NOT NULL,
      timestamp      TIMESTAMPTZ  NOT NULL,
      noise_level_db NUMERIC(6,2) NOT NULL,
      created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `;

  const createNoiseReadingsIndexes = `
    CREATE INDEX IF NOT EXISTS idx_noise_readings_timestamp   ON noise_readings (timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_noise_readings_device_id   ON noise_readings (device_id);
    CREATE INDEX IF NOT EXISTS idx_noise_readings_location    ON noise_readings (location);
    CREATE INDEX IF NOT EXISTS idx_noise_readings_created_at  ON noise_readings (created_at DESC);
  `;

  const createNoiseFeaturesTable = `
    CREATE TABLE IF NOT EXISTS noise_features (
      id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      noise_reading_id   UUID         NOT NULL REFERENCES noise_readings(id) ON DELETE CASCADE,
      timestamp          TIMESTAMPTZ  NOT NULL,
      noise_status       VARCHAR(100),
      noise_category     VARCHAR(50),
      noise_alerts       JSONB        NOT NULL DEFAULT '[]',
      noise_health_score NUMERIC(5,2),
      created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `;

  const createNoiseFeaturesIndexes = `
    CREATE INDEX IF NOT EXISTS idx_noise_features_reading_id  ON noise_features (noise_reading_id);
    CREATE INDEX IF NOT EXISTS idx_noise_features_timestamp   ON noise_features (timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_noise_features_created_at  ON noise_features (created_at DESC);
  `;

  const createNoisePredictionsTable = `
    CREATE TABLE IF NOT EXISTS noise_predictions (
      id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      timestamp                TIMESTAMPTZ  NOT NULL,
      forecast_time            TIMESTAMPTZ  NOT NULL,
      predicted_noise_level    NUMERIC(6,2),
      predicted_noise_category VARCHAR(50),
      confidence_score         NUMERIC(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
      model_version            VARCHAR(50),
      created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `;

  const createNoisePredictionsIndexes = `
    CREATE INDEX IF NOT EXISTS idx_noise_predictions_timestamp     ON noise_predictions (timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_noise_predictions_forecast_time ON noise_predictions (forecast_time DESC);
    CREATE INDEX IF NOT EXISTS idx_noise_predictions_created_at   ON noise_predictions (created_at DESC);
  `;

  // ══════════════════════════════════════════════════════════════════════════
  // EXECUTE ALL DDL IN DEPENDENCY ORDER
  // ══════════════════════════════════════════════════════════════════════════
  try {
    await pool.query(createExtension);

    // Weather tables
    await pool.query(createWeatherReadingsTable);
    await pool.query(createWeatherReadingsIndexes);
    await pool.query(createWeatherFeaturesTable);
    await pool.query(createWeatherFeaturesIndexes);
    await pool.query(createWeatherPredictionsTable);
    await pool.query(createWeatherPredictionsIndexes);

    // Air quality tables
    await pool.query(createBuildingEnvTable);
    await pool.query(createBuildingEnvIndexes);
    await pool.query(createAqReadingsTable);
    await pool.query(createAqReadingsIndexes);
    await pool.query(createAqFeaturesTable);
    await pool.query(createAqFeaturesIndexes);
    await pool.query(createAqPredictionsTable);
    await pool.query(createAqPredictionsIndexes);

    // Noise tables
    await pool.query(createNoiseReadingsTable);
    await pool.query(createNoiseReadingsIndexes);
    await pool.query(createNoiseFeaturesTable);
    await pool.query(createNoiseFeaturesIndexes);
    await pool.query(createNoisePredictionsTable);
    await pool.query(createNoisePredictionsIndexes);

    console.log(
      "[DATABASE] Schema verified/initialized (10 tables across Weather, Air Quality, and Noise modules)"
    );
  } catch (err) {
    console.error("[ERROR] Database initialization failed:", err.message);
    throw err;
  }
}

module.exports = { initDatabase };
