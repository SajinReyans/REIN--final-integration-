/**
 * Air Feature Engineering Service
 *
 * Computes AQI, AQI category, dominant pollutant, air health score, and
 * air alerts from raw sensor readings. Runs automatically after each
 * air_quality_readings insert — no external trigger required.
 *
 * AQI methodology: US EPA linear interpolation using standard breakpoints.
 * Sub-indices are calculated for PM2.5, PM10, CO, O3, and NOx (as NO2 proxy).
 * Overall AQI = max(all sub-indices), which is the standard EPA composite rule.
 * PM1, PM4, and VOC contribute to health score and alerts but lack official
 * EPA breakpoints so are excluded from the AQI sub-index calculation.
 */

const airFeatureModel = require("../models/airFeatureModel");

// ═════════════════════════════════════════════════════════════════════════════
// EPA AQI BREAKPOINTS
// Each entry: [C_lo, C_hi, AQI_lo, AQI_hi]
// ═════════════════════════════════════════════════════════════════════════════

const PM25_BP = [
  [  0.0,  12.0,   0,  50],
  [ 12.1,  35.4,  51, 100],
  [ 35.5,  55.4, 101, 150],
  [ 55.5, 150.4, 151, 200],
  [150.5, 250.4, 201, 300],
  [250.5, 350.4, 301, 400],
  [350.5, 500.4, 401, 500],
];

const PM10_BP = [
  [  0,  54,   0,  50],
  [ 55, 154,  51, 100],
  [155, 254, 101, 150],
  [255, 354, 151, 200],
  [355, 424, 201, 300],
  [425, 504, 301, 400],
  [505, 604, 401, 500],
];

// CO in ppm (8-hour average)
const CO_BP = [
  [ 0.0,  4.4,   0,  50],
  [ 4.5,  9.4,  51, 100],
  [ 9.5, 12.4, 101, 150],
  [12.5, 15.4, 151, 200],
  [15.5, 30.4, 201, 300],
  [30.5, 40.4, 301, 400],
  [40.5, 50.4, 401, 500],
];

// O3 in ppb (8-hour standard; no EPA sub-index > 300 for 8-hour)
const O3_BP = [
  [  0,  54,   0,  50],
  [ 55,  70,  51, 100],
  [ 71,  85, 101, 150],
  [ 86, 105, 151, 200],
  [106, 200, 201, 300],
];

// NO2 in ppb — used as NOx proxy (1-hour standard)
const NO2_BP = [
  [   0,   53,   0,  50],
  [  54,  100,  51, 100],
  [ 101,  360, 101, 150],
  [ 361,  649, 151, 200],
  [ 650, 1249, 201, 300],
  [1250, 1649, 301, 400],
  [1650, 2049, 401, 500],
];

// ═════════════════════════════════════════════════════════════════════════════
// CALCULATION HELPERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * EPA linear interpolation for a single pollutant sub-index.
 * Returns 500 (max) if concentration is above all defined breakpoints.
 *
 * @param {number}   concentration
 * @param {number[][]} breakpoints - Array of [C_lo, C_hi, AQI_lo, AQI_hi]
 * @returns {number} Integer sub-index (0–500)
 */
function calcSubIndex(concentration, breakpoints) {
  if (concentration < 0) return 0;
  for (const [C_lo, C_hi, AQI_lo, AQI_hi] of breakpoints) {
    if (concentration >= C_lo && concentration <= C_hi) {
      const subIdx = ((AQI_hi - AQI_lo) / (C_hi - C_lo)) * (concentration - C_lo) + AQI_lo;
      return Math.round(subIdx);
    }
  }
  return 500; // concentration exceeds highest breakpoint
}

/**
 * Calculates the overall AQI and identifies the dominant pollutant.
 *
 * @param {object} p - Pollutant concentrations
 * @param {number} p.pm25 - µg/m³
 * @param {number} p.pm10 - µg/m³
 * @param {number} p.co   - ppm
 * @param {number} p.o3   - ppb
 * @param {number} p.nox  - ppb (used as NO2 proxy)
 * @returns {{ aqi: number, dominantPollutant: string }}
 */
function calcAqi({ pm25, pm10, co, o3, nox }) {
  const subIndices = {
    "PM2.5": calcSubIndex(pm25, PM25_BP),
    "PM10":  calcSubIndex(pm10, PM10_BP),
    "CO":    calcSubIndex(co,   CO_BP),
    "O3":    calcSubIndex(o3,   O3_BP),
    "NOx":   calcSubIndex(nox,  NO2_BP),
  };

  let aqi = 0;
  let dominantPollutant = "PM2.5";

  for (const [pollutant, value] of Object.entries(subIndices)) {
    if (value > aqi) {
      aqi = value;
      dominantPollutant = pollutant;
    }
  }

  return { aqi, dominantPollutant };
}

/**
 * Maps an AQI value to its EPA category string.
 *
 * @param {number} aqi
 * @returns {string}
 */
function calcAqiCategory(aqi) {
  if (aqi <= 50)  return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

/**
 * Derives a composite air health score (0–100, higher = healthier).
 * Formula: 100 - clamp(AQI / 5, 0, 100)
 * At AQI=0 → score=100 (perfect). At AQI=500 → score=0 (worst).
 *
 * @param {number} aqi
 * @returns {number}
 */
function calcAirHealthScore(aqi) {
  return Math.max(0, Math.min(100, Math.round(100 - aqi / 5)));
}

/**
 * Generates an array of human-readable alert strings from sensor readings.
 * Alerts are ordered by severity (most critical first).
 *
 * @param {object} p - Pollutant concentrations
 * @param {number} aqi - Overall AQI
 * @returns {string[]}
 */
function calcAirAlerts({ pm1, pm25, pm4, pm10, co2, nox, voc, co, o3 }, aqi) {
  const alerts = [];

  if (aqi >= 301)       alerts.push("Hazardous Air Quality");
  else if (aqi >= 201)  alerts.push("Very Unhealthy Air Quality");
  else if (aqi >= 151)  alerts.push("Unhealthy Air Quality");

  if (pm25 > 55.5)      alerts.push("High PM2.5 — Sensitive groups at risk");
  if (pm10 > 255)       alerts.push("High PM10 — Respiratory irritant");
  if (pm1  > 55)        alerts.push("Elevated PM1 — Ultra-fine particles detected");
  if (pm4  > 100)       alerts.push("Elevated PM4 — Fine particle accumulation");
  if (co   > 9.5)       alerts.push("CO Warning — Elevated carbon monoxide");
  if (co   > 30.5)      alerts.push("CO Danger — Immediately hazardous CO level");
  if (o3   > 71)        alerts.push("High O3 — Ozone unhealthy for sensitive groups");
  if (o3   > 106)       alerts.push("Very High O3 — Ozone alert");
  if (nox  > 101)       alerts.push("Elevated NOx — Nitrogen oxide above safe level");
  if (co2  > 1000)      alerts.push("High CO2 — Poor ventilation indicated");
  if (co2  > 2000)      alerts.push("Very High CO2 — Ventilation required immediately");
  if (voc  > 150)       alerts.push("Elevated VOC — High volatile organic compounds");

  return alerts;
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Computes all air quality features from a stored air_quality_readings row and
 * inserts them into air_quality_features. Errors are caught and logged — a
 * feature engineering failure must never crash the MQTT pipeline.
 *
 * @param {object} reading - Row returned by airQualityModel.insertReading()
 * @returns {Promise<object|null>} The inserted features row, or null on failure
 */
async function computeAndStore(reading) {
  try {
    const {
      id, timestamp, pm1, pm25, pm4, pm10, co2, nox, voc, co, o3,
    } = reading;

    const { aqi, dominantPollutant } = calcAqi({ pm25, pm10, co, o3, nox });
    const aqiCategory    = calcAqiCategory(aqi);
    const airHealthScore = calcAirHealthScore(aqi);
    const airAlerts      = calcAirAlerts({ pm1, pm25, pm4, pm10, co2, nox, voc, co, o3 }, aqi);

    const features = await airFeatureModel.insertFeatures({
      airReadingId:     id,
      timestamp,
      aqi,
      aqiCategory,
      dominantPollutant,
      airHealthScore,
      airAlerts,
    });

    console.log(
      `[AQ-FEATURES] Computed for reading ${id}: AQI=${aqi} (${aqiCategory}), ` +
      `dominant=${dominantPollutant}, score=${airHealthScore}, alerts=${airAlerts.length}`
    );

    return features;
  } catch (err) {
    console.error("[ERROR] Air feature engineering failed:", err.message);
    return null;
  }
}

module.exports = {
  computeAndStore,
  // Exported individually for unit testing
  calcSubIndex,
  calcAqi,
  calcAqiCategory,
  calcAirHealthScore,
  calcAirAlerts,
};
