
- `/api/weather/dashboard`
- `/api/air/dashboard`
- `/api/noise/dashboard`
- `/api/health`

The frontend uses Vite proxying in local development. When hosted separately, set `VITE_BACKEND_URL` in `frontend/.env` and set `FRONTEND_URL` in `backend/.env`.

## ESP32 payloads

The backend's existing validation and MQTT flow have not been replaced. Keep publishing the original payload fields expected by `backend/src/middleware/validator.js`.
