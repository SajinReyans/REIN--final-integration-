/**
 * Noise Feature Engineering Service
 *
 * Computes noise category, noise status, health score, and alerts from raw
 * noise sensor readings. Runs automatically after each noise_readings insert.
 */

const noiseFeatureModel = require("../models/noiseFeatureModel");

// ═════════════════════════════════════════════════════════════════════════════
// CALCULATION HELPERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Classifies noise level into a general category.
 *
 * @param {number} db - Noise level in decibels
 * @returns {string} 'Low', 'Moderate', or 'High'
 */
function calcNoiseCategory(db) {
  if (db < 60) return "Low";
  if (db <= 85) return "Moderate";
  return "High";
}

/**
 * Determines current noise condition status.
 *
 * @param {string} category - 'Low', 'Moderate', or 'High'
 * @returns {string}
 */
function calcNoiseStatus(category) {
  if (category === "Low") return "Quiet / Optimal";
  if (category === "Moderate") return "Noticeable / Acceptable";
  return "Loud / Hazardous";
}

/**
 * Calculates a 0-100 health score based on noise level.
 * Formula: 100 for <= 40dB, 0 for >= 120dB, linear interpolation in between.
 *
 * @param {number} db - Noise level in decibels
 * @returns {number}
 */
function calcNoiseHealthScore(db) {
  if (db <= 40) return 100;
  if (db >= 120) return 0;
  // Linear scale between 40 and 120 (range of 80 dB maps to 100 points)
  const score = 100 - ((db - 40) / 80) * 100;
  return Math.round(score);
}

/**
 * Generates an array of human-readable alert strings based on noise levels.
 *
 * @param {number} db - Noise level in decibels
 * @returns {string[]}
 */
function calcNoiseAlerts(db) {
  const alerts = [];
  if (db > 120) alerts.push("Immediate Danger — Hearing loss possible");
  else if (db > 85) alerts.push("Hearing Protection Recommended");
  else if (db > 70) alerts.push("Elevated Noise — May cause annoyance");
  return alerts;
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Computes all noise features from a stored noise_readings row and
 * inserts them into noise_features.
 *
 * @param {object} reading - Row returned by noiseModel.insertReading()
 * @returns {Promise<object|null>} The inserted features row, or null on failure
 */
async function computeAndStore(reading) {
  try {
    const { id, timestamp, noise_level_db: db } = reading;

    const noiseCategory = calcNoiseCategory(db);
    const noiseStatus = calcNoiseStatus(noiseCategory);
    const noiseHealthScore = calcNoiseHealthScore(db);
    const noiseAlerts = calcNoiseAlerts(db);

    const features = await noiseFeatureModel.insertFeatures({
      noiseReadingId: id,
      timestamp,
      noiseStatus,
      noiseCategory,
      noiseAlerts,
      noiseHealthScore,
    });

    console.log(
      `[NOISE-FEATURES] Computed for reading ${id}: Category=${noiseCategory}, ` +
      `Score=${noiseHealthScore}, Alerts=${noiseAlerts.length}`
    );

    return features;
  } catch (err) {
    console.error("[ERROR] Noise feature engineering failed:", err.message);
    return null;
  }
}

module.exports = {
  computeAndStore,
  calcNoiseCategory,
  calcNoiseStatus,
  calcNoiseHealthScore,
  calcNoiseAlerts,
};
