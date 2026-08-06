const { createMqttClient } = require("../config/mqtt");
const { validateWeatherPayload, validateAirQualityPayload, validateNoisePayload } = require("../middleware/validator");
const weatherService = require("./weatherService");
const airQualityService = require("./airQualityService");
const noiseService = require("./noiseService");

/**
 * Wires up the MQTT client's "message" handler. Malformed JSON or invalid
 * telemetry is logged and discarded — it never crashes the process.
 * Routes messages based on the topic they were published to.
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
      // ── Weather Flow ────────────────────────────────────────────────────────
      const { valid, errors, data } = validateWeatherPayload(payload);
      if (!valid) {
        console.error("[ERROR] Weather MQTT payload failed validation:", errors.join("; "));
        return;
      }
      await weatherService.storeAndBroadcastReading(data);
    } 
    else if (topic === airTopic) {
      // ── Air Quality Flow ────────────────────────────────────────────────────
      const { valid, errors, data } = validateAirQualityPayload(payload);
      if (!valid) {
        console.error("[ERROR] Air Quality MQTT payload failed validation:", errors.join("; "));
        return;
      }
      await airQualityService.storeAndBroadcastReading(data);
    }
    else if (topic === noiseTopic) {
      // ── Noise Flow ──────────────────────────────────────────────────────────
      const { valid, errors, data } = validateNoisePayload(payload);
      if (!valid) {
        console.error("[ERROR] Noise MQTT payload failed validation:", errors.join("; "));
        return;
      }
      await noiseService.storeAndBroadcastReading(data);
    }
    else {
      console.log(`[MQTT] Ignored message on unknown topic: ${topic}`);
    }
  });

  return client;
}

module.exports = { startMqttService };
