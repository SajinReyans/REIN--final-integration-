require("dotenv").config();

const http = require("http");
const { createApp } = require("./app");
const { initSocket } = require("./config/socket");
const { testConnection, closePool } = require("./config/database");
const { initDatabase } = require("./database/init");
const { startMqttService } = require("./services/mqttService");
const { closeMqttClient } = require("./config/mqtt");

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

let httpServer;
let mqttClient;

async function start() {
  // 1. Verify PostgreSQL connectivity and ensure schema exists
  const dbOk = await testConnection();
  if (dbOk) {
    await initDatabase();
  } else {
    console.error("[ERROR] Starting without a verified database connection. API calls that touch the DB will fail until PostgreSQL is reachable.");
  }

  // 2. Build Express app + HTTP server
  const app = createApp();
  httpServer = http.createServer(app);

  // 3. Attach Socket.IO to the same HTTP server
  initSocket(httpServer);

  // 4. Start MQTT subscriber (auto-reconnects on its own)
  mqttClient = startMqttService();

  // 5. Listen on 0.0.0.0 so the ESP32 and other LAN devices can reach it
  httpServer.listen(PORT, HOST, () => {
    console.log(`[SERVER] Running on port ${PORT}`);
    console.log(`[SERVER] Dashboard: http://${HOST}:${PORT}  (use your LAN IP from another device)`);
  });
}

async function shutdown(signal) {
  console.log(`\n[SERVER] Received ${signal}, shutting down gracefully...`);

  try {
    if (mqttClient) {
      await closeMqttClient();
      console.log("[MQTT] Client closed");
    }
  } catch (err) {
    console.error("[ERROR] Error closing MQTT client:", err.message);
  }

  try {
    await closePool();
    console.log("[DATABASE] Connection pool closed");
  } catch (err) {
    console.error("[ERROR] Error closing database pool:", err.message);
  }

  if (httpServer) {
    httpServer.close(() => {
      console.log("[SERVER] HTTP server closed");
      process.exit(0);
    });
    // Force-exit if something hangs
    setTimeout(() => process.exit(0), 5000).unref();
  } else {
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch((err) => {
  console.error("[ERROR] Fatal startup error:", err);
  process.exit(1);
});
