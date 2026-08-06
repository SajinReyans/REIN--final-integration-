/**
 * Feature Engineering Service
 *
 * Computes derived weather features from raw sensor readings and persists them
 * to the weather_features table. Runs automatically after each successful
 * weather_readings insert — no external trigger required.
 */

const weatherFeaturesModel = require("../models/weatherFeaturesModel");

// ─── Heat Index (Rothfusz / NWS regression) ───────────────────────────────────
// Valid when temperature >= 27 °C AND relative humidity >= 40 %.
// All constants taken from the official NWS Heat Index Equation.
const HI_C1 = -8.78469475556;
const HI_C2 =  1.61139411;
const HI_C3 =  2.33854883889;
const HI_C4 = -0.14611605;
const HI_C5 = -0.012308094;
const HI_C6 = -0.0164248277778;
const HI_C7 =  0.002211732;
const HI_C8 =  0.00072546;
const HI_C9 = -0.000003582;

/**
 * Calculates the Heat Index in °C using the Rothfusz regression.
 * Returns null when the formula's validity conditions are not met.
 *
 * @param {number} tempC   - Dry-bulb temperature in °C
 * @param {number} humidity - Relative humidity in %
 * @returns {number|null}
 */
function calcHeatIndex(tempC, humidity) {
  const T = tempC;
  const R = humidity;

  if (T < 27 || R < 40) {
    return null; // outside valid range — return null, not a bogus number
  }

  const hi =
    HI_C1 +
    HI_C2 * T +
    HI_C3 * R +
    HI_C4 * T * R +
    HI_C5 * T * T +
    HI_C6 * R * R +
    HI_C7 * T * T * R +
    HI_C8 * T * R * R +
    HI_C9 * T * T * R * R;

  return Math.round(hi * 100) / 100; // 2 decimal places
}

// ─── Dew Point (Magnus formula) ───────────────────────────────────────────────
const MAGNUS_A = 17.625;
const MAGNUS_B = 243.04; // °C

/**
 * Calculates the Dew Point temperature in °C using the Magnus formula.
 *
 * @param {number} tempC    - Dry-bulb temperature in °C
 * @param {number} humidity - Relative humidity in %
 * @returns {number}
 */
function calcDewPoint(tempC, humidity) {
  const rh = Math.max(humidity, 0.01); // guard against log(0)
  const lnRh = Math.log(rh / 100);
  const alpha = lnRh + (MAGNUS_A * tempC) / (MAGNUS_B + tempC);
  const dewPoint = (MAGNUS_B * alpha) / (MAGNUS_A - alpha);
  return Math.round(dewPoint * 100) / 100;
}

// ─── Weather Status (rule-based) ──────────────────────────────────────────────
/**
 * Derives a human-readable weather status from sensor values.
 *
 * Priority order (highest wins):
 *   Stormy  → rainfall > 20 mm  OR  windSpeed >= 15 m/s
 *   Rainy   → rainfall > 5 mm
 *   Cloudy  → humidity >= 75 %
 *   Sunny   → otherwise
 *
 * @param {number} rainfall   - mm
 * @param {number} humidity   - %
 * @param {number} windSpeed  - m/s
 * @returns {string}
 */
function calcWeatherStatus(rainfall, humidity, windSpeed) {
  if (rainfall > 20 || windSpeed >= 15) return "Stormy";
  if (rainfall > 5)                      return "Rainy";
  if (humidity >= 75)                    return "Cloudy";
  return "Sunny";
}

// ─── Rain Alert ───────────────────────────────────────────────────────────────
/**
 * Returns true when current rainfall exceeds the alert threshold (5 mm).
 *
 * @param {number} rainfall - mm
 * @returns {boolean}
 */
function calcRainAlert(rainfall) {
  return rainfall > 5;
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Computes all derived features from a stored weather_readings row and inserts
 * them into weather_features. Errors are caught and logged — a feature
 * engineering failure must never crash the MQTT pipeline.
 *
 * @param {object} reading - Row returned by weatherModel.insertReading()
 * @returns {Promise<object|null>} The inserted weather_features row, or null on failure
 */
async function computeAndStore(reading) {
  try {
    const { id, timestamp, temperature, humidity, rainfall, wind_speed } = reading;

    const heatIndex    = calcHeatIndex(temperature, humidity);
    const dewPoint     = calcDewPoint(temperature, humidity);
    const weatherStatus = calcWeatherStatus(rainfall, humidity, wind_speed);
    const rainAlert    = calcRainAlert(rainfall);

    const features = await weatherFeaturesModel.insertFeatures({
      weatherReadingId: id,
      timestamp,
      heatIndex,
      dewPoint,
      weatherStatus,
      rainAlert,
    });

    console.log(
      `[FEATURES] Computed for reading ${id}: status=${weatherStatus}, heatIndex=${heatIndex}, dewPoint=${dewPoint}, rainAlert=${rainAlert}`
    );

    return features;
  } catch (err) {
    console.error("[ERROR] Feature engineering failed:", err.message);
    return null;
  }
}

module.exports = {
  computeAndStore,
  // Exported for unit testing
  calcHeatIndex,
  calcDewPoint,
  calcWeatherStatus,
  calcRainAlert,
};
