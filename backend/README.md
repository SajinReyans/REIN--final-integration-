# ESP32 Weather Monitoring System

A local, on-premise IoT weather dashboard. An ESP32 publishes telemetry over MQTT,
a Node.js/Express server validates it and stores it in PostgreSQL, and a
Socket.IO + EJS/Tailwind dashboard shows every new reading live, with no page
refresh and no polling.

## 1. Architecture

```
ESP32 (dummy or real sensors)
   │  Wi-Fi
   ▼
MQTT publish → topic: weather/data
   │
   ▼
Mosquitto broker (runs on your laptop)
   │
   ▼
Node.js MQTT subscriber (src/services/mqttService.js)
   │  validate payload (src/middleware/validator.js)
   ▼
PostgreSQL  (src/models/weatherModel.js)
   │  ONLY on successful insert
   ▼
Socket.IO emit "weather:new" (src/services/weatherService.js)
   │
   ▼
Browser dashboard updates instantly (public/js/dashboard.js)
```

On page load, the browser does **not** wait for the next MQTT message — it
calls `GET /api/weather/latest` and `GET /api/weather/history` first
(PostgreSQL → REST API → EJS/JS), then Socket.IO takes over for live updates.

## 2. Tech stack

- **Backend:** Node.js, Express.js, MQTT.js, PostgreSQL (`pg`), Socket.IO, dotenv, EJS
- **Frontend:** EJS, HTML5, CSS3, Tailwind CSS, vanilla JS, Socket.IO client
- **Messaging:** MQTT via Mosquitto

## 3. Prerequisites

Install these on the laptop that will act as your local server:

1. **Node.js** ≥ 18 — https://nodejs.org
2. **PostgreSQL** ≥ 13 — https://www.postgresql.org/download/
3. **Mosquitto MQTT broker** — https://mosquitto.org/download/

## 4. Project structure

```
weather-monitoring/
├── package.json
├── .env.example
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── server.js            # entrypoint: HTTP + Socket.IO + MQTT + shutdown
│   ├── app.js                # Express app: routes, view engine, static files
│   ├── config/                # database.js, mqtt.js, socket.js
│   ├── controllers/           # weatherController.js
│   ├── services/               # weatherService.js, mqttService.js
│   ├── models/                  # weatherModel.js (parameterized SQL)
│   ├── routes/                   # weatherRoutes.js
│   ├── middleware/                 # validator.js, errorHandler.js
│   └── database/                    # init.js (auto schema creation)
├── views/
│   ├── dashboard.ejs
│   └── partials/ (header.ejs, footer.ejs)
└── public/
    ├── js/dashboard.js
    └── css/ (input.css → build → output.css)
```

## 5. Setup

### 5.1 Install dependencies

```bash
cd weather-monitoring
npm install
```

### 5.2 Create the PostgreSQL database and user

```bash
psql -U postgres
```

```sql
CREATE DATABASE weather_monitoring;
CREATE USER weather_user WITH ENCRYPTED PASSWORD 'change_me';
GRANT ALL PRIVILEGES ON DATABASE weather_monitoring TO weather_user;
```

The table itself (`weather_readings`) is created automatically the first
time the server starts (`src/database/init.js`) — it will never drop
existing data on restart.

### 5.3 Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set `DATABASE_PASSWORD` to match what you used above, and set
`MQTT_BROKER_URL` to your **laptop's LAN IP** (not `localhost` — see step 7),
e.g. `mqtt://192.168.1.100:1883`.

### 5.4 Build Tailwind CSS

```bash
npm run build
```

(Use `npm run tailwind` instead during development — it watches for changes.)

### 5.5 Start Mosquitto

```bash
mosquitto -v
```

By default Mosquitto only listens on localhost. To let the ESP32 connect,
create a config file, e.g. `mosquitto.conf`:

```
listener 1883 0.0.0.0
allow_anonymous true
```

Then run:

```bash
mosquitto -c mosquitto.conf -v
```

(`allow_anonymous true` is fine for a local dev network; see Security notes below.)

### 5.6 Start the application

```bash
npm run dev     # nodemon, auto-restarts on file changes
# or
npm start       # plain node
```

You should see:

```
[DATABASE] Connected
[DATABASE] Schema verified/initialized (weather_readings)
[MQTT] Connecting...
[MQTT] Connected
[MQTT] Subscribed to weather/data
[SERVER] Running on port 5000
```

### 5.7 Open the dashboard

```
http://localhost:5000
```

or, from another device on the same network:

```
http://YOUR_LAPTOP_IP:5000
```

## 6. Finding your laptop's local IP address

- **Windows:** open Command Prompt → `ipconfig` → look for "IPv4 Address" under your active adapter.
- **macOS/Linux:** `ifconfig` or `ip addr` → look for the address under `en0`/`wlan0` (usually `192.168.x.x`).

Use this same IP for `MQTT_BROKER_URL` in `.env` and for the ESP32's MQTT
broker setting.

## 7. Testing without the ESP32

You can exercise the entire backend and frontend before touching hardware.

**Subscribe (to watch raw MQTT traffic):**

```bash
mosquitto_sub -h localhost -t weather/data -v
```

**Publish a fake reading:**

```bash
mosquitto_pub -h localhost -t weather/data -m "{\"deviceId\":\"ESP32-Weather-001\",\"temperature\":29.4,\"humidity\":72.5,\"aqi\":64,\"rainfall\":0.4,\"timestamp\":\"2026-07-29T08:30:00Z\"}"
```

Watch your Node.js terminal log the receive → store → emit sequence, and
watch the dashboard update instantly with no refresh.

**Test the REST API directly:**

```bash
curl http://localhost:5000/api/weather/latest
curl http://localhost:5000/api/weather/history?page=1&limit=10
curl http://localhost:5000/api/weather/stats
curl http://localhost:5000/api/health
```

## 8. ESP32 configuration

The ESP32 should publish JSON to the `weather/data` topic in exactly this shape:

```json
{
  "deviceId": "ESP32-Weather-001",
  "temperature": 29.4,
  "humidity": 72.5,
  "aqi": 64,
  "rainfall": 0.4,
  "timestamp": "2026-07-29T08:30:00Z"
}
```

- Broker: your laptop's LAN IP, port `1883`
- The ESP32 and laptop **must be on the same Wi-Fi network**
- Start with dummy/random values; when real sensors (e.g. SHT85 for
  temperature/humidity, an AQI sensor, a tipping-bucket rain gauge) are
  wired in, keep the same JSON shape — nothing on the backend needs to change.

## 9. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `[ERROR] PostgreSQL connection failed` | Postgres isn't running, or `.env` credentials are wrong |
| `[MQTT] Reconnecting...` forever | Mosquitto isn't running, or `MQTT_BROKER_URL` points to the wrong IP |
| Dashboard loads but never goes "LIVE" | Socket.IO can't reach the server — check firewall / that you're on the same network |
| ESP32 can't publish | Mosquitto is only listening on `127.0.0.1` — bind it to `0.0.0.0` (see 5.5) |
| Dashboard is unstyled | Run `npm run build` to generate `public/css/output.css` |

## 10. Firewall configuration

Local dev machines often block inbound connections by default. Allow inbound
TCP on:

- `1883` (MQTT) — for the ESP32
- `5000` (or whatever `PORT` you set) — for browsers on other devices

On Windows: Windows Defender Firewall → Advanced settings → Inbound Rules →
New Rule → Port → TCP → enter the port numbers above.

## 11. Security notes (local dev)

- Credentials live in `.env`, which is git-ignored — never commit it.
- All MQTT payloads are validated (`src/middleware/validator.js`) before
  anything touches the database.
- All PostgreSQL queries are parameterized (`src/models/weatherModel.js`) —
  no string-concatenated SQL.
- Don't expose PostgreSQL's port (`5432`) or Mosquitto's port (`1883`)
  beyond your local network / router.
- To add MQTT auth later: set `MQTT_USERNAME`/`MQTT_PASSWORD` in `.env`
  (already wired up in `src/config/mqtt.js`) and configure a
  `password_file` in Mosquitto instead of `allow_anonymous true`.
- To add TLS later: switch `MQTT_BROKER_URL` to `mqtts://...`, configure
  certificates in Mosquitto, and pass a `ca`/`cert`/`key` object in the
  `mqtt.connect()` options in `src/config/mqtt.js`.

## 12. End-to-end testing checklist

```
[ ] PostgreSQL running
[ ] Database created
[ ] Mosquitto running
[ ] MQTT topic working
[ ] Node.js connected to PostgreSQL
[ ] Node.js connected to MQTT
[ ] MQTT test message received
[ ] PostgreSQL row created
[ ] Socket.IO connected (dashboard shows LIVE)
[ ] Dashboard loads latest data on open
[ ] Live MQTT message updates dashboard without refresh
[ ] ESP32 connected to Wi-Fi
[ ] ESP32 publishes telemetry
[ ] ESP32 telemetry appears in PostgreSQL
[ ] ESP32 telemetry appears live on dashboard
```

## 13. Extending this later

The MVC/service split keeps this easy to grow into:

- Python ML processing / weather prediction (read straight from PostgreSQL)
- Additional sensors (extend the payload + validator + schema)
- Multiple ESP32 devices (already supported — everything is keyed by `device_id`)
- Authentication (add middleware in `src/middleware/`)
- Historical charts (data's already exposed via `/api/weather/history` and `/api/weather/stats`)
- Alerts (hook into `weatherService.storeAndBroadcastReading`)
- Role-based access
