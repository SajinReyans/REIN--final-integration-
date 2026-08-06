/**
 * Validates an incoming weather telemetry payload from the ESP32 device.
 *
 * Expected payload shape:
 * {
 *   deviceId:        string   — device identifier (required)
 *   location:        string   — physical location label (required)
 *   firmwareVersion: string   — firmware version (optional, not stored in DB)
 *   timestamp:       string   — ISO 8601 timestamp (required)
 *   temperature:     number   — °C, range [-50, 100]
 *   humidity:        number   — %, range [0, 100]
 *   rainfall:        number   — mm, range [0, 1000]
 *   windSpeed:       number   — m/s, range [0, 200]
 *   windDirection:   number   — degrees, range [0, 360]
 * }
 *
 * Returns { valid: boolean, errors: string[], data: object|null }
 */
function validateWeatherPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== "object") {
    return { valid: false, errors: ["Payload must be a JSON object"], data: null };
  }

  const {
    deviceId,
    location,
    firmwareVersion, // optional — read but not validated
    timestamp,
    temperature,
    humidity,
    rainfall,
    windSpeed,
    windDirection,
  } = payload;

  // ── deviceId ──────────────────────────────────────────────────────────────
  if (typeof deviceId !== "string" || deviceId.trim().length === 0) {
    errors.push("deviceId is required and must be a non-empty string");
  }

  // ── location ──────────────────────────────────────────────────────────────
  if (typeof location !== "string" || location.trim().length === 0) {
    errors.push("location is required and must be a non-empty string");
  }

  // ── timestamp ─────────────────────────────────────────────────────────────
  if (typeof timestamp !== "string" || Number.isNaN(Date.parse(timestamp))) {
    errors.push("timestamp is required and must be a valid ISO 8601 timestamp");
  }

  // ── temperature ───────────────────────────────────────────────────────────
  if (typeof temperature !== "number" || Number.isNaN(temperature)) {
    errors.push("temperature is required and must be numeric");
  } else if (temperature < -50 || temperature > 100) {
    errors.push("temperature must be between -50 and 100 °C");
  }

  // ── humidity ──────────────────────────────────────────────────────────────
  if (typeof humidity !== "number" || Number.isNaN(humidity)) {
    errors.push("humidity is required and must be numeric");
  } else if (humidity < 0 || humidity > 100) {
    errors.push("humidity must be between 0 and 100 %");
  }

  // ── rainfall ──────────────────────────────────────────────────────────────
  if (typeof rainfall !== "number" || Number.isNaN(rainfall)) {
    errors.push("rainfall is required and must be numeric");
  } else if (rainfall < 0 || rainfall > 1000) {
    errors.push("rainfall must be between 0 and 1000 mm");
  }

  // ── windSpeed ─────────────────────────────────────────────────────────────
  if (typeof windSpeed !== "number" || Number.isNaN(windSpeed)) {
    errors.push("windSpeed is required and must be numeric");
  } else if (windSpeed < 0 || windSpeed > 200) {
    errors.push("windSpeed must be between 0 and 200 m/s");
  }

  // ── windDirection ─────────────────────────────────────────────────────────
  if (typeof windDirection !== "number" || Number.isNaN(windDirection)) {
    errors.push("windDirection is required and must be numeric");
  } else if (windDirection < 0 || windDirection > 360) {
    errors.push("windDirection must be between 0 and 360 degrees");
  }

  if (errors.length > 0) {
    return { valid: false, errors, data: null };
  }

  return {
    valid: true,
    errors: [],
    data: {
      deviceId:      deviceId.trim(),
      location:      location.trim(),
      timestamp,
      temperature,
      humidity,
      rainfall,
      windSpeed,
      windDirection,
      // firmwareVersion is intentionally excluded from the stored data object
    },
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// AIR QUALITY PAYLOAD VALIDATION
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Validates an incoming air quality telemetry payload from an air sensor node.
 *
 * Required fields:
 *   deviceId, location, floorLevel, timestamp
 *   pm1, pm25, pm4, pm10 (µg/m³)
 *   co2 (ppm), nox (ppb), voc (index), co (ppm), o3 (ppb)
 *
 * Optional fields (building-level environmental, only one floor needs to send):
 *   temperature (°C), humidity (%)
 *
 * Returns { valid: boolean, errors: string[], data: object|null }
 * data.temperature and data.humidity are null when not present in payload.
 */
function validateAirQualityPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== "object") {
    return { valid: false, errors: ["Payload must be a JSON object"], data: null };
  }

  const {
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
    temperature, // optional
    humidity,    // optional
  } = payload;

  // ── Device & location ─────────────────────────────────────────────────────
  if (typeof deviceId !== "string" || deviceId.trim().length === 0) {
    errors.push("deviceId is required and must be a non-empty string");
  }
  if (typeof location !== "string" || location.trim().length === 0) {
    errors.push("location is required and must be a non-empty string");
  }
  if (typeof floorLevel !== "string" || floorLevel.trim().length === 0) {
    errors.push("floorLevel is required and must be a non-empty string (e.g. 'bottom', 'top')");
  }

  // ── Timestamp ─────────────────────────────────────────────────────────────
  if (typeof timestamp !== "string" || Number.isNaN(Date.parse(timestamp))) {
    errors.push("timestamp is required and must be a valid ISO 8601 timestamp");
  }

  // ── Particulate matter (µg/m³) ────────────────────────────────────────────
  if (typeof pm1 !== "number" || Number.isNaN(pm1)) {
    errors.push("pm1 is required and must be numeric");
  } else if (pm1 < 0 || pm1 > 1000) {
    errors.push("pm1 must be between 0 and 1000 µg/m³");
  }

  if (typeof pm25 !== "number" || Number.isNaN(pm25)) {
    errors.push("pm25 is required and must be numeric");
  } else if (pm25 < 0 || pm25 > 1000) {
    errors.push("pm25 must be between 0 and 1000 µg/m³");
  }

  if (typeof pm4 !== "number" || Number.isNaN(pm4)) {
    errors.push("pm4 is required and must be numeric");
  } else if (pm4 < 0 || pm4 > 1000) {
    errors.push("pm4 must be between 0 and 1000 µg/m³");
  }

  if (typeof pm10 !== "number" || Number.isNaN(pm10)) {
    errors.push("pm10 is required and must be numeric");
  } else if (pm10 < 0 || pm10 > 1000) {
    errors.push("pm10 must be between 0 and 1000 µg/m³");
  }

  // ── Gas concentrations ────────────────────────────────────────────────────
  if (typeof co2 !== "number" || Number.isNaN(co2)) {
    errors.push("co2 is required and must be numeric");
  } else if (co2 < 0 || co2 > 10000) {
    errors.push("co2 must be between 0 and 10000 ppm");
  }

  if (typeof nox !== "number" || Number.isNaN(nox)) {
    errors.push("nox is required and must be numeric");
  } else if (nox < 0 || nox > 2000) {
    errors.push("nox must be between 0 and 2000 ppb");
  }

  if (typeof voc !== "number" || Number.isNaN(voc)) {
    errors.push("voc is required and must be numeric");
  } else if (voc < 0 || voc > 500) {
    errors.push("voc must be between 0 and 500 (index)");
  }

  if (typeof co !== "number" || Number.isNaN(co)) {
    errors.push("co is required and must be numeric");
  } else if (co < 0 || co > 100) {
    errors.push("co must be between 0 and 100 ppm");
  }

  if (typeof o3 !== "number" || Number.isNaN(o3)) {
    errors.push("o3 is required and must be numeric");
  } else if (o3 < 0 || o3 > 600) {
    errors.push("o3 must be between 0 and 600 ppb");
  }

  // ── Temperature (optional) ────────────────────────────────────────────────
  let validatedTemperature = null;
  if (temperature !== undefined && temperature !== null) {
    if (typeof temperature !== "number" || Number.isNaN(temperature)) {
      errors.push("temperature must be numeric when provided");
    } else if (temperature < -50 || temperature > 100) {
      errors.push("temperature must be between -50 and 100 °C");
    } else {
      validatedTemperature = temperature;
    }
  }

  // ── Humidity (optional) ───────────────────────────────────────────────────
  let validatedHumidity = null;
  if (humidity !== undefined && humidity !== null) {
    if (typeof humidity !== "number" || Number.isNaN(humidity)) {
      errors.push("humidity must be numeric when provided");
    } else if (humidity < 0 || humidity > 100) {
      errors.push("humidity must be between 0 and 100 %");
    } else {
      validatedHumidity = humidity;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, data: null };
  }

  return {
    valid: true,
    errors: [],
    data: {
      deviceId:   deviceId.trim(),
      location:   location.trim(),
      floorLevel: floorLevel.trim(),
      timestamp,
      pm1, pm25, pm4, pm10,
      co2, nox, voc, co, o3,
      temperature: validatedTemperature, // null if not supplied
      humidity:    validatedHumidity,    // null if not supplied
    },
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// NOISE PAYLOAD VALIDATION
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Validates an incoming noise telemetry payload from a noise sensor node.
 *
 * Required fields:
 *   deviceId, location, timestamp
 *   noiseLevel (dB)
 *
 * Returns { valid: boolean, errors: string[], data: object|null }
 */
function validateNoisePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { valid: false, errors: ["Payload must be a JSON object"], data: null };
  }

  // ── deviceId ──────────────────────────────────────────────────────────────
  let deviceId = payload.deviceId ?? payload.device_id ?? payload.device ?? payload.id ?? payload.sensorId ?? payload.sensor_id;
  if (typeof deviceId !== "string" || deviceId.trim().length === 0) {
    deviceId = "noise-sensor-01";
  } else {
    deviceId = deviceId.trim();
  }

  // ── location ──────────────────────────────────────────────────────────────
  let location = payload.location ?? payload.loc ?? payload.place;
  if (typeof location !== "string" || location.trim().length === 0) {
    location = "campus";
  } else {
    location = location.trim();
  }

  // ── timestamp ─────────────────────────────────────────────────────────────
  let timestamp = payload.timestamp ?? payload.time ?? payload.createdAt ?? payload.created_at;
  if (typeof timestamp === "number") {
    timestamp = new Date(timestamp).toISOString();
  } else if (typeof timestamp !== "string" || Number.isNaN(Date.parse(timestamp))) {
    timestamp = new Date().toISOString();
  }

  // ── Noise Level (dB) ──────────────────────────────────────────────────────
  // Arduino / ESP32 C++ sends: doc.createNestedObject("noise")["noiseLevel"] = noiseLevel
  let rawNoiseLevel;

  // 1) First check nested object shapes (Arduino JSON)
  if (payload.noise && typeof payload.noise === "object") {
    rawNoiseLevel =
      payload.noise.noiseLevel ??
      payload.noise.noiselevel ??
      payload.noise.noise_level ??
      payload.noise.noise_level_db ??
      payload.noise.noiseLevelDb ??
      payload.noise.db ??
      payload.noise.decibels ??
      payload.noise.level ??
      payload.noise.soundLevel ??
      payload.noise.sound_level ??
      payload.noise.value;
  } else if (payload.data && typeof payload.data === "object") {
    rawNoiseLevel =
      payload.data.noiseLevel ??
      payload.data.noiselevel ??
      payload.data.noise_level ??
      payload.data.noise_level_db ??
      payload.data.noiseLevelDb ??
      payload.data.noise ??
      payload.data.db ??
      payload.data.decibels ??
      payload.data.level ??
      payload.data.value;
  }

  // 2) If not found in a nested object, check top-level properties
  if (rawNoiseLevel === undefined || rawNoiseLevel === null) {
    rawNoiseLevel =
      payload.noiseLevel ??
      payload.noiselevel ??
      payload.noise_level ??
      payload.noise_level_db ??
      payload.noiseLevelDb ??
      (typeof payload.noise === "number" ? payload.noise : undefined) ??
      payload.db ??
      payload.decibels ??
      payload.level ??
      payload.soundLevel ??
      payload.sound_level ??
      payload.value;
  }

  const resolvedNoiseLevel = Number(rawNoiseLevel);

  if (!Number.isFinite(resolvedNoiseLevel)) {
    return { valid: false, errors: ["noiseLevel is required and must be numeric"], data: null };
  }
  if (resolvedNoiseLevel < 0 || resolvedNoiseLevel > 200) {
    return { valid: false, errors: ["noiseLevel must be between 0 and 200 dB"], data: null };
  }

  return {
    valid: true,
    errors: [],
    data: {
      deviceId,
      location,
      timestamp,
      noiseLevelDb: resolvedNoiseLevel,
    },
  };
}

/**
 * Express middleware wrapper for validating pagination query params.
 */
function validatePagination(req, res, next) {
  let page = parseInt(req.query.page, 10);
  let limit = parseInt(req.query.limit, 10);

  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = 50;
  if (limit > 200) limit = 200; // hard ceiling to protect the database

  req.pagination = { page, limit, offset: (page - 1) * limit };
  next();
}

module.exports = {
  validateWeatherPayload,
  validateAirQualityPayload,
  validateNoisePayload,
  validatePagination,
};
