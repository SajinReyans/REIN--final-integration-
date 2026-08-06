# REIN - Real-time Environmental Information Network

Welcome to the **REIN (Real-time Environmental Information Network)** repository documentation. This document serves as the master data specification for both:
1. **MQTT Telemetry Requirements (Backend)**: The exact JSON payload schemas, topics, data types, and value ranges expected by the backend from ESP32 / IoT sensor nodes over MQTT.
2. **Frontend Component & Page Data Requirements**: Comprehensive breakdown of every frontend page and UI component, detailing the data items required for rendering.

---

## 📋 Table of Contents

- [1. MQTT Data Requirements (Backend)](#1-mqtt-data-requirements-backend)
  - [1.1 MQTT Connection & Subscription Overview](#11-mqtt-connection--subscription-overview)
  - [1.2 Topic 1: Weather Telemetry (`weather/data`)](#12-topic-1-weather-telemetry-weatherdata)
  - [1.3 Topic 2: Air Quality Telemetry (`air-quality/data`)](#13-topic-2-air-quality-telemetry-air-qualitydata)
  - [1.4 Topic 3: Noise Telemetry (`noise/data`)](#14-topic-3-noise-telemetry-noisedata)
  - [1.5 Summary Table of MQTT Ingestion](#15-summary-table-of-mqtt-ingestion)
- [2. Frontend Data Requirements by Component & Page](#2-frontend-data-requirements-by-component--page)
  - [2.1 Core Application Shell & Navigation](#21-core-application-shell--navigation)
  - [2.2 Main Dashboard (`/pages/Dashboard.tsx`)](#22-main-dashboard-pagesdashboardtsx)
  - [2.3 Environmental Modules (`EcoPulseLayout.tsx`)](#23-environmental-modules-ecopulselayouttsx)
  - [2.4 Specialized Environmental Cards (`/components/environmental/`)](#24-specialized-environmental-cards-componentsenvironmental)
  - [2.5 Campus Map (`/pages/CampusMap.tsx`)](#25-campus-map-pagescampusmmaptsx)
  - [2.6 Analytics Page (`/pages/Analytics.tsx`)](#26-analytics-page-pagesanalyticstsx)
  - [2.7 AI Predictions Page (`/pages/AIInsights.tsx`)](#27-ai-predictions-page-pagesaiinsightstsx)
  - [2.8 Management Page (`/pages/Management.tsx`)](#28-management-page-pagesmanagementtsx)
  - [2.9 Landing Page (`/pages/LandingPage.tsx`)](#29-landing-page-pageslandingpagetsx)
- [3. End-to-End Data Pipeline Flow](#3-end-to-end-data-pipeline-flow)

---

## 1. MQTT Data Requirements (Backend)

The REIN Backend acts as an MQTT subscriber. It ingests sensor telemetry from IoT hardware (ESP32 nodes), validates payloads, stores raw readings in PostgreSQL, performs feature engineering (heat index, AQI, noise tiers), and streams live updates to the frontend via Socket.IO and REST APIs.

### 1.1 MQTT Connection & Subscription Overview

- **Default MQTT Broker URL**: `mqtt://localhost:1883` (Configurable via `MQTT_BROKER_URL`)
- **Default Client ID**: `weather-node-server-<random_hash>` (Configurable via `MQTT_CLIENT_ID`)
- **QoS Level**: `1` (At least once delivery)
- **Subscribed Topics**:
  - Weather: `weather/data` (Configurable via `MQTT_TOPIC`)
  - Air Quality: `air-quality/data` (Configurable via `MQTT_AIR_TOPIC`)
  - Noise: `noise/data` (Configurable via `MQTT_NOISE_TOPIC`)

---

### 1.2 Topic 1: Weather Telemetry (`weather/data`)

Published by ESP32 weather station nodes.

#### JSON Payload Schema Example:
```json
{
  "deviceId": "ESP32_WEATHER_01",
  "location": "Academic Block A Roof",
  "timestamp": "2026-08-06T12:00:00Z",
  "temperature": 29.4,
  "humidity": 65.0,
  "rainfall": 0.0,
  "windSpeed": 3.2,
  "windDirection": 180.0,
  "firmwareVersion": "v1.2.0"
}
```

#### Field Specifications & Rules:

| Field Name | Type | Required / Optional | Unit / Format | Valid Range | Description & Backend Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `deviceId` | `string` | **Required** | Plain String | Non-empty | Unique identifier of the weather station ESP32 |
| `location` | `string` | **Required** | Plain String | Non-empty | Physical deployment location label |
| `timestamp` | `string` | **Required** | ISO 8601 UTC | Valid Timestamp | Observation timestamp (e.g. `2026-08-06T12:00:00Z`) |
| `temperature` | `number` | **Required** | °C | `-50.0` to `100.0` | Ambient air temperature |
| `humidity` | `number` | **Required** | % | `0.0` to `100.0` | Relative humidity percentage |
| `rainfall` | `number` | **Required** | mm | `0.0` to `1000.0` | Precipitation depth accumulated |
| `windSpeed` | `number` | **Required** | m/s | `0.0` to `200.0` | Wind speed velocity |
| `windDirection` | `number` | **Required** | Degrees (°) | `0.0` to `360.0` | Compass wind direction bearing |
| `firmwareVersion` | `string` | Optional | Semantic Version | N/A | Device firmware version (logged, excluded from DB) |

#### Backend Features Computed from Weather Payload:
- **`heat_index`**: Derived in °C using Rothfusz regression equation.
- **`dew_point`**: Derived in °C using Magnus-Tetens approximation.
- **`weather_status`**: Categorized condition string (`Clear`, `Rainy`, `Hot`, `Extreme`).
- **`rain_alert`**: Boolean flag (`true` when `rainfall > 0`).

---

### 1.3 Topic 2: Air Quality Telemetry (`air-quality/data`)

Published by air pollution monitoring nodes deployed in indoor/outdoor campus zones.

#### JSON Payload Schema Example:
```json
{
  "deviceId": "ESP32_AQ_01",
  "location": "Central Library",
  "floorLevel": "ground",
  "timestamp": "2026-08-06T12:00:00Z",
  "pm1": 12.5,
  "pm25": 18.2,
  "pm4": 24.0,
  "pm10": 32.1,
  "co2": 410.0,
  "nox": 18.0,
  "voc": 3.0,
  "co": 0.5,
  "o3": 42.0,
  "temperature": 24.5,
  "humidity": 55.0
}
```

#### Field Specifications & Rules:

| Field Name | Type | Required / Optional | Unit / Format | Valid Range | Description & Backend Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `deviceId` | `string` | **Required** | Plain String | Non-empty | Unique air quality node identifier |
| `location` | `string` | **Required** | Plain String | Non-empty | Building or zone location name |
| `floorLevel` | `string` | **Required** | Plain String | Non-empty | Floor indicator (e.g., `"ground"`, `"floor_1"`, `"top"`) |
| `timestamp` | `string` | **Required** | ISO 8601 UTC | Valid Timestamp | Reading timestamp |
| `pm1` | `number` | **Required** | µg/m³ | `0.0` to `1000.0` | Ultra-fine Particulate Matter PM1.0 |
| `pm25` | `number` | **Required** | µg/m³ | `0.0` to `1000.0` | Fine Particulate Matter PM2.5 |
| `pm4` | `number` | **Required** | µg/m³ | `0.0` to `1000.0` | Particulate Matter PM4.0 |
| `pm10` | `number` | **Required** | µg/m³ | `0.0` to `1000.0` | Coarse Particulate Matter PM10 |
| `co2` | `number` | **Required** | ppm | `0.0` to `10000.0` | Carbon Dioxide gas concentration |
| `nox` | `number` | **Required** | ppb | `0.0` to `2000.0` | Nitrogen Oxides concentration |
| `voc` | `number` | **Required** | Index | `0.0` to `500.0` | Volatile Organic Compounds index |
| `co` | `number` | **Required** | ppm | `0.0` to `100.0` | Carbon Monoxide gas concentration |
| `o3` | `number` | **Required** | ppb | `0.0` to `600.0` | Ground-level Ozone gas concentration |
| `temperature` | `number` | Optional | °C | `-50.0` to `100.0` | Indoor building ambient temperature |
| `humidity` | `number` | Optional | % | `0.0` to `100.0` | Indoor building relative humidity |

#### Backend Features Computed from Air Quality Payload:
- **`aqi`**: US EPA Air Quality Index sub-index calculated from PM2.5 and PM10.
- **`aqi_category`**: AQI status level (`Good`, `Moderate`, `Unhealthy for Sensitive Groups`, `Unhealthy`, `Very Unhealthy`, `Hazardous`).
- **`dominant_pollutant`**: The pollutant gas or particulate driving the highest AQI index value.
- **`air_health_score`**: Normalized composite score from 0 to 100 representing overall breathability.
- **`air_alerts`**: Dynamic array of pollutant breach warning strings.

---

### 1.4 Topic 3: Noise Telemetry (`noise/data`)

Published by sound level meter nodes placed across campus study areas and outdoor plazas.

#### JSON Payload Schema Example:
```json
{
  "deviceId": "ESP32_NOISE_01",
  "location": "Auditorium Quad",
  "timestamp": "2026-08-06T12:00:00Z",
  "noiseLevel": 48.5
}
```

#### Field Specifications & Rules:

| Field Name | Type | Required / Optional | Unit / Format | Valid Range | Description & Backend Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `deviceId` | `string` | **Required** | Plain String | Non-empty | Acoustic node device identifier |
| `location` | `string` | **Required** | Plain String | Non-empty | Noise monitoring location label |
| `timestamp` | `string` | **Required** | ISO 8601 UTC | Valid Timestamp | Audio sampling timestamp |
| `noiseLevel` | `number` | **Required** | dB(A) | `0.0` to `200.0` | Equivalent continuous sound pressure level ($L_{eq}$) |

#### Backend Features Computed from Noise Payload:
- **`noise_level_db`**: Mapped value stored in PostgreSQL table `noise_readings`.
- **`noise_category`**: Acoustic classification (`Quiet` < 55 dB, `Moderate` 55–75 dB, `High` > 75 dB).
- **`noise_status`**: Human-readable acoustic environment status string.
- **`noise_health_score`**: 0 to 100 acoustic comfort score.
- **`noise_alerts`**: Array of sound threshold breach notices.

---

### 1.5 Summary Table of MQTT Ingestion

```
+-------------------+--------------------+------------------------+-------------------------------------------------------------+
| MQTT Topic        | Environment Var    | Frequency / Driver     | Target DB Table(s)                                          |
+-------------------+--------------------+------------------------+-------------------------------------------------------------+
| weather/data      | MQTT_TOPIC         | Periodic (e.g. 5-30s)  | weather_readings, weather_features                         |
| air-quality/data  | MQTT_AIR_TOPIC     | Periodic (e.g. 10-60s) | air_quality_readings, air_quality_features, building_env    |
| noise/data        | MQTT_NOISE_TOPIC   | Periodic (e.g. 2-10s)  | noise_readings, noise_features                             |
+-------------------+--------------------+------------------------+-------------------------------------------------------------+
```

---

## 2. Frontend Data Requirements by Component & Page

The frontend dashboard consumes data via:
- REST API Endpoints: `/api/weather/dashboard`, `/api/air/dashboard`, `/api/noise/dashboard`
- Socket.IO WebSockets: Real-time broadcast channels (`weather_update`, `air_quality_update`, `noise_update`)
- Local Component State / Static Datasets (`data.ts`, page mock structures)

Below is the complete catalog of all frontend pages and UI components, including the exact data elements required to display them.

---

### 2.1 Core Application Shell & Navigation

#### `App.tsx` (Root Container)
- **Data Needed**:
  - `showLanding` (`boolean`): Toggle state for landing page vs main dashboard.
  - `page` (`PageKey`): Active navigation target (`'dashboard'`, `'map'`, `'weather'`, `'air'`, `'noise'`, `'management'`, `'analytics'`, `'ai'`).
  - `dark` (`boolean`): Application dark mode theme status.

#### `Sidebar.tsx` (Navigation Bar)
- **Data Needed**:
  - `active` (`PageKey`): Currently highlighted page route.
  - `onNav` (`(page: PageKey) => void`): Navigation callback handler.
  - Navigation items list: Label, icon, and route key for each section.

#### `TopNav.tsx` (Header Bar)
- **Data Needed**:
  - `page` (`PageKey`): Title header text mapping for the current page.
  - `dark` (`boolean`): Current theme toggle state.
  - System status string (e.g. `"Operational"`, `"Connected"`).
  - Unread alert notifications count.

---

### 2.2 Main Dashboard (`/pages/Dashboard.tsx`)

#### Overall Dashboard Page (`Dashboard`)
- **Data Needed**:
  - **7-Day Environmental Trend Dataset**: Arrays of historical data for AQI (`number[]`), Temperature (`number[]`), and Noise (`number[]`) mapped across week days (`Mon` through `Sun`).
  - **Recent System Alerts**: Array of alert objects containing:
    - `level` (`'bad' | 'warn' | 'good' | 'info'`)
    - `title` (`string`, e.g. `"Noise threshold exceeded"`)
    - `loc` (`string`, e.g. `"Block C · Library Annex"`)
    - `time` (`string`, e.g. `"4m ago"`)

#### `HeroSlideshowCard` (Top Overview Header)
- **Data Needed**:
  - `score` (`number`): Overall campus composite environmental score (e.g., `89/100`).
  - `headline` (`string`): Overall campus health summary (e.g., `"Excellent — Campus is thriving today"`).
  - `description` (`string`): Paragraph explaining active zone counts, air quality, noise, and weather stability.
  - `quote` (`string`): Inspirational environmental quote.
  - `slides` (`string[]`): Image path array for campus background slides (`/dashboard-slides/slide-1.png`, etc.).
  - `activeSlideIndex` (`number`): Current slide counter state.

#### `KpiCard` (Key Metric Card Widget)
- **Data Needed**:
  - `label` (`string`): Metric title (e.g., `"Air Quality Index"`, `"Weather"`, `"Noise Level"`).
  - `value` (`string`): Main numerical readout (e.g., `"42"`, `"29°C"`, `"48"`).
  - `unit` (`string`): Unit or qualitative label (e.g., `"AQI"`, `"Partly Cloudy"`, `"dB(A)"`).
  - `status` (`string`): Badge styling variant (`'good'`, `'info'`, `'warn'`, `'bad'`).
  - `statusLabel` (`string`): Status text badge (e.g., `"Good"`, `"Stable"`, `"Quiet"`).
  - `color` (`string`): Hex code accent color.
  - `sparkData` (`number[]`): Mini 7-point array for rendering the sparkline curve.
  - `pct` (`string`): Comparative change percentage (e.g., `"-6.1%"`).
  - `dir` (`'up' | 'down'`): Trend arrow indicator direction.
  - `iconPath` (`ReactNode`): SVG vector icon.

---

### 2.3 Environmental Modules (`EcoPulseLayout.tsx`)

`EcoPulseLayout.tsx` provides dedicated views for Weather, Air Quality, and Noise modules, fed dynamically by the `useEnvironmentalData()` hook.

#### 1. Weather Module (`WeatherPageLayout` / `WeatherModule`)
- **Data Required** (`data.weather`):
  - `summary` (`string`): Full condition readout (e.g., `"Clear · 29.4°C · Humidity 65%"`).
  - `condition` (`string`): Weather state (`"Clear"`, `"Rainy"`, `"Hot"`).
  - `quote` (`string[]`): Informational header quotes array.
  - `healthDescription` (`string`): Text describing source telemetry and calculation methodology.
  - `metrics` (`WeatherMetric[]`):
    1. **Temperature**: value (°C), status, supporting text (Humidity %).
    2. **Heat Index**: value (°C), status (`good`/`moderate`/`poor`), calculation note.
    3. **Dew Point**: value (°C), calculation note.
    4. **Weather Status**: status label, wind speed (m/s).
    5. **Rain Alert**: active flag (`0` or `1`), rainfall depth (mm), alert status (`Active`/`Clear`).
  - `forecast` (`ForecastDay[]`): 7-day array of daily low/high temperatures and condition icons.
  - `status`: Object `{ label, description, status }`.
  - `alerts`: Object `{ count, message, status }`.

#### 2. Air Quality Module (`AirPageLayout` / `AirModule`)
- **Data Required** (`data.air`):
  - `score` (`number`): Overall Air Quality Health Score (0–100).
  - `healthDescription` (`string`): Active AQI category and numerical index (e.g. `"Good · AQI 42"`).
  - `aboutDescription` (`string`): Node telemetry overview text.
  - `quote` (`string[]`): Quotation banner text array.
  - `particulates` (`ParticulateReading[]`): Array of 4 particulate metrics:
    - **PM1.0**: value (µg/m³), status (`good`/`moderate`/`poor`), trend (`up`/`down`/`stable`).
    - **PM2.5**: value (µg/m³), status, trend.
    - **PM4.0**: value (µg/m³), status, trend.
    - **PM10**: value (µg/m³), status, trend.
  - `gases` (`GasReading[]`): Array of 5 gas concentration readings:
    - **CO₂ (Carbon Dioxide)**: value (ppm), status label (`Normal`/`Elevated`/`High`).
    - **CO (Carbon Monoxide)**: value (ppm), status label.
    - **O₃ (Ozone)**: value (ppb), status label.
    - **NOx (Nitrogen Oxides)**: value (ppb), status label.
    - **VOC (Volatile Organic Compounds)**: value (index), status label.

#### 3. Noise Module (`NoisePageLayout` / `NoiseModule`)
- **Data Required** (`data.noise`):
  - `level` (`number`): Sound level value in dB(A).
  - `category` (`string`): Category label (`"Quiet"`, `"Moderate"`, `"High"`).
  - `categoryTier` (`'low' | 'moderate' | 'high'`): Acoustic severity tier.
  - `score` (`number`): Acoustic comfort health score (0–100).
  - `scoreSubtitle` (`string`): Health score description.
  - `statusLabel` & `statusDetail` (`string`): Main acoustic environment status lines.
  - `quote` (`string`): Quotation string.
  - `stats` (`{ label: string, value: string }[]`): Properties array (`Current Level`, `Location`, `Device`, `Transport`).
  - `alerts` (`NoiseAlert[]`): Active sound warnings list (`id`, `title`, `detail`, `ok` boolean).

---

### 2.4 Specialized Environmental Cards (`/components/environmental/`)

- **`WeatherCard.tsx`**: Renders live temperature, humidity, rain depth, wind velocity, heat index, dew point, and weather warning badges.
- **`AirQualityCard.tsx`**: Renders AQI gauge ring, primary pollutant badge, PM1/PM2.5/PM4/PM10 progress bars, and gas concentration pills.
- **`NoiseMonitoringCard.tsx`**: Renders decibel radial meter, category tier badge (`low`/`moderate`/`high`), sound health score, and active acoustic threshold alert items.
- **`MetricCard.tsx`**: Generic re-usable metric card expecting title, value, unit, status tag, trend icon, and color theme.
- **`CircularProgress.tsx` / `ScoreRing.tsx`**: Expects numeric score (0–100), label string, dimension size, and SVG stroke color.

---

### 2.5 Campus Map (`/pages/CampusMap.tsx`)

#### Campus Map View (`CampusMap`)
- **Data Needed**:
  - `buildings` (`Building[]`): Array of building nodes containing:
    - `id` (`string`, e.g. `"A"`, `"B"`, `"C"`, `"D"`, `"E"`)
    - `name` (`string`, e.g. `"Block A · Engineering"`)
    - `x` & `y` (`number`): Marker coordinates (% position on aerial map image)
    - `status` (`'good' | 'warn' | 'bad'`): Health indicator state
    - `health` (`number`): Health score out of 100
    - `aqi` (`number`): Local building Air Quality Index
    - `temp` (`number`): Local temperature (°C)
    - `hum` (`number`): Local humidity (%)
    - `noise` (`number`): Local noise level (dB)
  - `selected` (`Building | null`): Currently inspected building object for modal popup.

#### `BuildingDetailCard` (Modal Overlay)
- **Data Needed**:
  - Full selected `Building` object properties (Name, status badge, health score, AQI, Temperature, Humidity, Noise level).
  - Dynamic calculated sensor stats: Total sensors, active count, offline count, last updated timestamp.

---

### 2.6 Analytics Page (`/pages/Analytics.tsx`)

- **Data Needed**:
  - `range` (`'day' | 'week' | 'month'`): Active aggregation timeframe selection.
  - `L` (`string[]`): Time labels array (`['12am', '4am', ...]` or `['Mon', 'Tue', ...]`).
  - `aqiTrend` (`number[]`): Historical AQI data curve over selected range.
  - `weatherTrend` (`number[]`): Historical temperature curve over selected range.
  - `noiseTrend` (`number[]`): Historical noise decibel curve over selected range.
  - `sensorPerformance` (`number[]`): Sensor network quality metrics (`Uptime %`, `Delivery %`, `Delay %`, `Offline %`).
  - `campusComparison` (`Building[]`): Health scores across all campus buildings for bar chart comparison.
  - `heatmapData`: Health score array for building tile intensity coloring.

---

### 2.7 AI Predictions Page (`/pages/AIInsights.tsx`)

#### AI Predictions Page (`AIInsights`)
- **Data Needed**:
  - `hours` (`string[]`): Forecast hours array (`['Now', '3h', '6h', '9h', '12h', '15h', '18h', '21h', '24h']`).

#### `PredictionCard` (Forecast Widgets)
- **Data Needed**:
  1. **Temperature Prediction**:
     - `value`: Peak forecasted temperature (e.g. `"30.6"`)
     - `unit`: `"°C peak"`
     - `trend`: `"+1.2° next 12h"`
     - `data`: 9-point array of temperature trajectory values
     - `summary`: Explanation text of warming/cooling patterns
  2. **Rain Prediction**:
     - `value`: Rain chance percentage (e.g. `"28"`)
     - `unit`: `"% chance"`
     - `trend`: `"Rising after 18h"`
     - `data`: 9-point array of precipitation probability %
     - `summary`: Summary of dry vs rainy periods
  3. **Noise Trend Prediction**:
     - `value`: Expected noise level (e.g. `"52"`)
     - `unit`: `"dB(A)"`
     - `trend`: `"Quieter tonight"`
     - `data`: 9-point array of expected sound levels
     - `summary`: Explanation of campus activity noise cycle
  4. **AI Outlook Summary Card**:
     - Overall 24-hour predictive synthesis paragraph.

---

### 2.8 Management Page (`/pages/Management.tsx`)

- **Data Needed**:
  - **Sensor Nodes Table**: List of registered sensor nodes with fields:
    - `id` (`string`, e.g. `"ESP32-WX-01"`)
    - `name` (`string`, e.g. `"Weather Station Alpha"`)
    - `location` (`string`, e.g. `"Block A Roof"`)
    - `type` (`'Weather' | 'Air Quality' | 'Noise'`)
    - `status` (`'online' | 'offline'`)
    - `battery` (`number`, e.g. `95`)
    - `signal` (`number`, RSSI in dBm, e.g. `-62`)
    - `firmware` (`string`, e.g. `"v1.2.0"`)
    - `lastSeen` (`string`, e.g. `"12s ago"`)
  - **Gateway & Server Health**: CPU utilization %, Memory usage %, Database connection pool status, MQTT Broker status (`Connected`/`Disconnected`).
  - **System Settings**: Alert thresholds, refresh intervals, notification email toggles.

---

### 2.9 Landing Page (`/pages/LandingPage.tsx`)

- **Data Needed**:
  - `onEnter` (`() => void`): Callback function to transition into the main application.
  - `onTransitionStart` (`() => void`): Callback trigger for reveal animations.
  - Hero tagline text, feature breakdown highlights, call-to-action button state.

---

## 3. End-to-End Data Pipeline Flow

```
   [ ESP32 IoT Nodes ]
   (Weather / AQ / Noise)
            │
            │ MQTT (JSON Payloads over TCP 1883)
            ▼
   ┌──────────────────────────────────┐
   │        REIN Node.js Backend      │
   │  - Validates schemas & ranges    │
   │  - Computes features (Heat Index,│
   │    AQI, Noise Tiers, Alerts)     │
   │  - Persists into PostgreSQL DB   │
   └──────────────────────────────────┘
            │
            ├──────────────────────────┐
            │ REST API Polling         │ Socket.IO Real-time Events
            ▼                          ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │                      REIN React Frontend                         │
   │  - useEnvironmentalData() Hook                                  │
   │  - Dashboard KPI Cards, EcoPulse Layouts                         │
   │  - WeatherCard, AirQualityCard, NoiseMonitoringCard             │
   │  - Campus Map, Analytics Charts, AI Predictions                 │
   └──────────────────────────────────────────────────────────────────┘
```

---

*Documentation generated for the REIN System.*
