const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT) || 5432,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

let isConnected = false;

pool.on("connect", () => {
  isConnected = true;
});

pool.on("error", (err) => {
  isConnected = false;
  console.error("[ERROR] Unexpected PostgreSQL pool error:", err.message);
});

async function testConnection() {
  try {
    await pool.query("SELECT 1");
    isConnected = true;
    console.log("[DATABASE] Connected");
    return true;
  } catch (err) {
    isConnected = false;
    console.error("[ERROR] PostgreSQL connection failed:", err.message);
    return false;
  }
}

function getConnectionStatus() {
  return isConnected;
}

async function closePool() {
  await pool.end();
  isConnected = false;
}

module.exports = {
  pool,
  testConnection,
  getConnectionStatus,
  closePool,
};
