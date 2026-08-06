# REIN Integrated Project

## Data flow

ESP32 sensors publish JSON to MQTT topics. The Node.js backend validates and stores the data in PostgreSQL. The React dashboard requests the combined dashboard endpoints every 3 seconds, so new sensor readings and computed features appear automatically.

- Weather MQTT topic: `weather/data`
- Air MQTT topic: `air-quality/data`
- Noise MQTT topic: `noise/data`
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

## First-time setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Enter the PostgreSQL and MQTT settings.
3. From the project root, run:

```powershell
npm install
npm run install:all
npm run dev
```

## Main API connections

- `/api/weather/dashboard`
- `/api/air/dashboard`
- `/api/noise/dashboard`
- `/api/health`

The frontend uses Vite proxying in local development. When hosted separately, set `VITE_BACKEND_URL` in `frontend/.env` and set `FRONTEND_URL` in `backend/.env`.

## ESP32 payloads

The backend's existing validation and MQTT flow have not been replaced. Keep publishing the original payload fields expected by `backend/src/middleware/validator.js`.
