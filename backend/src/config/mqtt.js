const mqtt = require("mqtt");

let client = null;
let isConnected = false;

function createMqttClient() {
  const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
  const options = {
    clientId: process.env.MQTT_CLIENT_ID || `weather-node-server-${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 3000, // auto-reconnect every 3s if disconnected
    connectTimeout: 10000,
  };

  if (process.env.MQTT_USERNAME) {
    options.username = process.env.MQTT_USERNAME;
    options.password = process.env.MQTT_PASSWORD || "";
  }

  console.log("[MQTT] Connecting...");
  client = mqtt.connect(brokerUrl, options);

  client.on("connect", () => {
    isConnected = true;
    console.log("[MQTT] Connected");
    
    const weatherTopic = process.env.MQTT_TOPIC || "weather/data";
    const airTopic = process.env.MQTT_AIR_TOPIC || "air-quality/data";
    const noiseTopic = process.env.MQTT_NOISE_TOPIC || "noise/data";
    
    // Subscribe to all topics including topic wildcards for noise sensors
    const topicsToSubscribe = Array.from(new Set([
      weatherTopic,
      airTopic,
      noiseTopic,
      "noise/#",
      "noise",
      "noise_data",
      "sensor/noise",
    ]));

    client.subscribe(topicsToSubscribe, { qos: 1 }, (err) => {
      if (err) {
        console.error("[ERROR] MQTT subscribe failed:", err.message);
      } else {
        console.log(`[MQTT] Subscribed to ${topicsToSubscribe.join(", ")}`);
      }
    });
  });

  client.on("reconnect", () => {
    console.log("[MQTT] Reconnecting...");
  });

  client.on("close", () => {
    isConnected = false;
    console.log("[MQTT] Connection closed");
  });

  client.on("offline", () => {
    isConnected = false;
    console.log("[MQTT] Client offline");
  });

  client.on("error", (err) => {
    isConnected = false;
    console.error("[ERROR] MQTT error:", err.message);
  });

  return client;
}

function getMqttClient() {
  return client;
}

function getMqttStatus() {
  return isConnected;
}

function closeMqttClient() {
  return new Promise((resolve) => {
    if (client) {
      client.end(false, {}, () => resolve());
    } else {
      resolve();
    }
  });
}

module.exports = {
  createMqttClient,
  getMqttClient,
  getMqttStatus,
  closeMqttClient,
};
