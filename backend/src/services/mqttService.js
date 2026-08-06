const { createMqttClient } = require("../config/mqtt");
const { validateWeatherPayload, validateAirQualityPayload, validateNoisePayload } = require("../middleware/validator");
const weatherService = require("./weatherService");
const airQualityService = require("./airQualityService");
const noiseService = require("./noiseService");

/**
 * Process air quality floor readings from a payload object (combined or standalone).
 */
async function processAirQualityPayload(payload) {
  const { deviceId, location, timestamp, air, airQuality } = payload;
  const airObj = airQuality || air;

  const floorBlocks = [];
  if (airObj && typeof airObj === "object") {
    if (airObj.bottomFloor && typeof airObj.bottomFloor === "object") {
      floorBlocks.push({ floorLevel: "bottom", data: airObj.bottomFloor });
    }
    if (airObj.topFloor && typeof airObj.topFloor === "object") {
      floorBlocks.push({ floorLevel: "top", data: airObj.topFloor });
    }
  }

  if (floorBlocks.length === 0) {
    // Fallback: single flat reading
    const { valid, errors, data } = validateAirQualityPayload(payload);
    if (!valid) {
      console.error("[ERROR] Air Quality payload failed validation:", errors.join("; "));
      return;
    }
    await airQualityService.storeAndBroadcastReading(data);
  } else {
    for (const block of floorBlocks) {
      const flatPayload = {
        deviceId: deviceId ?? `air-sensor-${block.floorLevel}`,
        location: location ?? "campus",
        floorLevel: block.floorLevel,
        timestamp: timestamp ?? new Date().toISOString(),
        pm1: block.data.pm1,
        pm25: block.data.pm25,
        pm4: block.data.pm4,
        pm10: block.data.pm10,
        co2: block.data.co2,
        nox: block.data.nox,
        voc: block.data.voc,
        co: block.data.co,
        o3: block.data.o3,
        temperature: block.data.temperature ?? payload.temperature ?? null,
        humidity: block.data.humidity ?? payload.humidity ?? null,
      };

      const { valid, errors, data } = validateAirQualityPayload(flatPayload);
      if (!valid) {
        console.error(
          `[ERROR] Air Quality (${block.floorLevel} floor) failed validation:`,
          errors.join("; ")
        );
        continue;
      }
      await airQualityService.storeAndBroadcastReading(data);
    }
  }
}

/**
 * Process noise level reading from a payload object (combined or standalone).
 */
async function processNoisePayload(payload) {
  const noiseObj = payload.noise;
  const rawNoise =
    (noiseObj && typeof noiseObj === "object")
      ? (noiseObj.noiseLevel ?? noiseObj.noiselevel ?? noiseObj.noise_level ?? noiseObj.level ?? noiseObj.db)
      : (payload.noiseLevel ?? payload.noiselevel ?? payload.noise_level ?? payload.noise ?? payload.db);

  const flatNoisePayload = {
    deviceId: payload.deviceId ?? "noise-sensor-01",
    location: payload.location ?? "campus",
    timestamp: payload.timestamp ?? new Date().toISOString(),
    noiseLevel: Number(rawNoise),
  };

  const { valid, errors, data } = validateNoisePayload(flatNoisePayload);
  if (!valid) {
    console.error("[ERROR] Noise payload failed validation:", errors.join("; "));
    return;
  }
  await noiseService.storeAndBroadcastReading(data);
}

/**
 * Wires up the MQTT client's "message" handler. Malformed JSON or invalid
 * telemetry is logged and discarded — it never crashes the process.
 * Routes messages based on the topic they were published to.
 * Supports combined payload on weather/data as well as standalone topics.
 */
function startMqttService() {
  const client = createMqttClient();

  const weatherTopic = process.env.MQTT_TOPIC || "weather/data";
  const airTopic = process.env.MQTT_AIR_TOPIC || "air-quality/data";
  const noiseTopic = process.env.MQTT_NOISE_TOPIC || "noise/data";

  client.on("message", async (topic, messageBuffer) => {
    const raw = messageBuffer.toString();
    console.log(`[MQTT] Received telemetry on ${topic}`);

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      console.error("[ERROR] Malformed MQTT JSON payload, discarding:", raw);
      return;
    }

    if (topic === weatherTopic) {
      // ── Combined Telemetry Payload on weather/data ─────────────────────────
      // (1) Weather module
      if (payload.temperature !== undefined || payload.humidity !== undefined) {
        const { valid, errors, data } = validateWeatherPayload(payload);
        if (!valid) {
          console.error("[ERROR] Weather MQTT payload failed validation:", errors.join("; "));
        } else {
          await weatherService.storeAndBroadcastReading(data);
        }
      }

      // (2) Air Quality module (airQuality.bottomFloor & airQuality.topFloor / air.bottomFloor & air.topFloor)
      if (payload.airQuality || payload.air) {
        await processAirQualityPayload(payload);
      }

      // (3) Noise module (noise.noiseLevel / noiseLevel)
      if (payload.noise !== undefined || payload.noiseLevel !== undefined) {
        await processNoisePayload(payload);
      }
    } 
    else if (topic === airTopic) {
      // ── Standalone Air Quality Topic ────────────────────────────────────────
      await processAirQualityPayload(payload);
    }
    else if (topic === noiseTopic || topic.startsWith("noise") || topic.includes("noise")) {
      // ── Standalone Noise Topic ──────────────────────────────────────────────
      await processNoisePayload(payload);
    }
    else {
      console.log(`[MQTT] Ignored message on unknown topic: ${topic}`);
    }
  });

  return client;
}

module.exports = { startMqttService };
