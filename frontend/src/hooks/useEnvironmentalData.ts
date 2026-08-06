import { useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CloudSun, Droplets, Sun, Thermometer, TriangleAlert } from 'lucide-react';
import type { EnvStatus } from '../lib/env-status';
import { buildSevenDayForecast } from '../lib/weather-forecast';

export type Trend = 'up' | 'down' | 'stable';

export interface WeatherMetric {
  id: string;
  name: string;
  value: string | number;
  unit: string;
  supportingText: string;
  icon: LucideIcon;
  status: EnvStatus;
  statusLabel: string;
  iconTint: 'blue' | 'cyan' | 'orange' | 'amber' | 'green';
}

export interface ParticulateReading {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: EnvStatus;
  statusLabel: string;
  trend: Trend;
}

export interface GasReading {
  id: string;
  symbol: string;
  fullName: string;
  value: number;
  unit: string;
  status: EnvStatus;
  statusLabel: string;
}

export interface NoiseAlert { id: string; title: string; detail: string; ok: boolean; }
export interface ForecastDay { day: string; condition: 'sunny' | 'partly' | 'rain'; high: number; low: number; }

/** One floor's air quality snapshot (from /api/air/readings/floors) */
export interface FloorReading {
  floorLevel: string;
  pm1: number; pm25: number; pm4: number; pm10: number;
  co2: number; nox: number; voc: number; co: number; o3: number;
  timestamp: string;
}

/** Rolling history of the last N sensor readings for sparklines */
export interface SensorHistory {
  temperature: number[];
  heatIndex: number[];
  dewPoint: number[];
  humidity: number[];
  noiseLevel: number[];
  aqi: number[];
}

export interface EnvironmentalData {
  weather: {
    score: number;
    summary: string;
    condition: string;
    quote: string[];
    healthDescription: string;
    metrics: WeatherMetric[];
    forecast: ForecastDay[];
    status: { label: string; description: string; status: EnvStatus };
    alerts: { count: number; message: string; status: EnvStatus };
    details: {
      temperature: number;
      humidity: number;
      rainfall: number;
      windSpeed: number;
      windDirection: number;
    };
  };
  air: {
    quote: string[];
    score: number;
    aboutDescription: string;
    healthDescription: string;
    particulates: ParticulateReading[];
    gases: GasReading[];
    /** Per-floor breakdown — bottom and top floor readings side by side */
    floors: FloorReading[];
  };
  noise: {
    quote: string;
    level: number;
    unit: string;
    category: string;
    categoryTier: 'low' | 'moderate' | 'high';
    statusLabel: string;
    statusDetail: string;
    score: number;
    scoreSubtitle: string;
    aboutDescription: string;
    stats: { label: string; value: string }[];
    alerts: NoiseAlert[];
  };
  lastUpdated: string;
  /** Composite health score across all three modules (0-100) */
  compositeScore: number;
  /** Total count of active alerts across all modules */
  systemAlerts: number;
  /** Rolling history of last 7 readings for each key metric */
  history: SensorHistory;
}

type DashboardResponse = { reading: Record<string, unknown> | null; features: Record<string, unknown> | null; prediction: Record<string, unknown> | null };

const HISTORY_SIZE = 7;

const backendUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const api = (path: string) => `${backendUrl}${path}`;
const n = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const s = (value: unknown, fallback: string) => typeof value === 'string' && value.trim() ? value : fallback;

function weatherStatus(condition: string): EnvStatus {
  const text = condition.toLowerCase();
  if (text.includes('storm') || text.includes('extreme')) return 'poor';
  if (text.includes('rain') || text.includes('hot')) return 'moderate';
  return 'good';
}

function airStatus(value: number, kind: string): EnvStatus {
  const limits: Record<string, [number, number]> = {
    pm1: [15, 35], pm25: [15, 35], pm4: [25, 50], pm10: [45, 100],
    co2: [800, 1200], co: [4, 9], o3: [50, 100], nox: [40, 100], voc: [100, 250],
  };
  const [good, moderate] = limits[kind] ?? [50, 100];
  if (value <= good) return 'good';
  if (value <= moderate) return 'moderate';
  return 'poor';
}

function makeDefaultHistory(): SensorHistory {
  return {
    temperature: [],
    heatIndex: [],
    dewPoint: [],
    humidity: [],
    noiseLevel: [],
    aqi: [],
  };
}

function makeDefaultData(): EnvironmentalData {
  const forecast = buildSevenDayForecast({
    tempC: 29.4,
    heatIndexC: 31.2,
    dewPointC: 18.5,
    condition: 'Waiting for ESP32 data',
    alertActive: false,
    recentDailyHighsC: [27, 28, 30, 31, 29, 28, 29.4],
  });

  return {
    weather: {
      score: 82,
      summary: 'Waiting for live ESP32 weather data',
      condition: 'Waiting for data',
      quote: ["Today's weather shapes your plans and your well-being.", 'Live values will appear when the ESP32 publishes telemetry.'],
      healthDescription: 'Live weather values received through MQTT and calculated by the REIN backend.',
      metrics: [
        { id: 'temp', name: 'Temperature', value: '--', unit: '°C', supportingText: 'ESP32 weather sensor', icon: Thermometer, status: 'good', statusLabel: 'Connecting', iconTint: 'blue' },
        { id: 'heat', name: 'Heat Index', value: '--', unit: '°C', supportingText: 'Calculated by backend', icon: Sun, status: 'moderate', statusLabel: 'Connecting', iconTint: 'orange' },
        { id: 'dew', name: 'Dew Point', value: '--', unit: '°C', supportingText: 'Calculated by backend', icon: Droplets, status: 'good', statusLabel: 'Connecting', iconTint: 'cyan' },
        { id: 'sky', name: 'Weather Status', value: 'Connecting...', unit: '', supportingText: 'MQTT connection pending', icon: CloudSun, status: 'good', statusLabel: 'Standby', iconTint: 'blue' },
        { id: 'alerts', name: 'Rain Alert', value: '0', unit: 'Active', supportingText: 'No active alert', icon: TriangleAlert, status: 'good', statusLabel: 'Clear', iconTint: 'amber' },
      ],
      forecast,
      status: { label: 'Connecting…', description: 'Start the backend and ESP32 MQTT publisher.', status: 'good' },
      alerts: { count: 0, message: 'No active alert', status: 'good' },
      details: {
        temperature: 0,
        humidity: 0,
        rainfall: 0,
        windSpeed: 0,
        windDirection: 0,
      },
    },
    air: {
      quote: ['Clean air supports a healthier campus.', 'Live values will appear when the air sensor publishes telemetry.'],
      score: 0,
      aboutDescription: 'Current particulate and gas measurements received from ESP32 nodes.',
      healthDescription: 'Connecting…',
      floors: [],
      particulates: [
        { id: 'pm1',  name: 'PM1',   value: 0, unit: 'µg/m³', status: 'good', statusLabel: 'Connecting', trend: 'stable' },
        { id: 'pm25', name: 'PM2.5', value: 0, unit: 'µg/m³', status: 'good', statusLabel: 'Connecting', trend: 'stable' },
        { id: 'pm4',  name: 'PM4',   value: 0, unit: 'µg/m³', status: 'good', statusLabel: 'Connecting', trend: 'stable' },
        { id: 'pm10', name: 'PM10',  value: 0, unit: 'µg/m³', status: 'good', statusLabel: 'Connecting', trend: 'stable' },
      ],
      gases: [
        { id: 'co2', symbol: 'CO₂', fullName: 'Carbon Dioxide',          value: 0, unit: 'ppm',   status: 'good', statusLabel: 'Connecting' },
        { id: 'co',  symbol: 'CO',  fullName: 'Carbon Monoxide',          value: 0, unit: 'ppm',   status: 'good', statusLabel: 'Connecting' },
        { id: 'o3',  symbol: 'O₃',  fullName: 'Ozone',                   value: 0, unit: 'ppb',   status: 'good', statusLabel: 'Connecting' },
        { id: 'nox', symbol: 'NOx', fullName: 'Nitrogen Oxides',          value: 0, unit: 'ppb',   status: 'good', statusLabel: 'Connecting' },
        { id: 'voc', symbol: 'VOC', fullName: 'Volatile Organic Compounds', value: 0, unit: 'index', status: 'good', statusLabel: 'Connecting' },
      ],
    },
    noise: {
      quote: 'A campus at its best is heard as gently as it is seen.',
      level: 0,
      unit: 'dB(A)',
      category: 'Connecting…',
      categoryTier: 'low',
      statusLabel: 'Waiting for ESP32 noise data',
      statusDetail: 'Live acoustic measurements will appear automatically.',
      score: 0,
      scoreSubtitle: 'Backend-computed noise health score',
      aboutDescription: 'Continuous acoustic monitoring through the REIN backend.',
      stats: [{ label: 'Current Level', value: '-- dB(A)' }, { label: 'Data Source', value: 'ESP32' }, { label: 'Transport', value: 'MQTT' }],
      alerts: [{ id: 'a1', title: 'No Active Alerts', detail: 'Waiting for live sensor data', ok: true }],
    },
    lastUpdated: 'connecting…',
    compositeScore: 0,
    systemAlerts: 0,
    history: makeDefaultHistory(),
  };
}

/** Push a value onto a rolling history array capped at HISTORY_SIZE */
function pushHistory(arr: number[], value: number): number[] {
  const next = [...arr, value];
  return next.length > HISTORY_SIZE ? next.slice(next.length - HISTORY_SIZE) : next;
}

function applyWeather(current: EnvironmentalData, dashboard: DashboardResponse): EnvironmentalData {
  const r = dashboard.reading ?? {};
  const f = dashboard.features ?? {};
  const temperature = n(r.temperature, n(current.weather.metrics[0].value, 0));
  const humidity = n(r.humidity, 0);
  const rainfall = n(r.rainfall, 0);
  const windSpeed = n(r.wind_speed, 0);
  const windDirection = n(r.wind_direction, 0);
  const heatIndex = n(f.heat_index, temperature);
  const dewPoint = n(f.dew_point, temperature);
  const condition = s(f.weather_status, rainfall > 0 ? 'Rainy' : 'Clear');
  const rainAlert = Boolean(f.rain_alert);
  const forecast = buildSevenDayForecast({ tempC: temperature, heatIndexC: heatIndex, dewPointC: dewPoint, condition, alertActive: rainAlert, recentDailyHighsC: [temperature] });
  const status = weatherStatus(condition);

  // Update rolling history
  const newHistory: SensorHistory = {
    ...current.history,
    temperature: pushHistory(current.history.temperature, temperature),
    heatIndex: pushHistory(current.history.heatIndex, heatIndex),
    dewPoint: pushHistory(current.history.dewPoint, dewPoint),
    humidity: pushHistory(current.history.humidity, humidity),
  };

  return {
    ...current,
    weather: {
      ...current.weather,
      summary: `${condition} · ${temperature.toFixed(1)}°C · Humidity ${humidity.toFixed(0)}%`,
      condition,
      metrics: [
        { ...current.weather.metrics[0], value: temperature.toFixed(1), supportingText: `Humidity ${humidity.toFixed(0)}%`, status, statusLabel: 'Live' },
        { ...current.weather.metrics[1], value: heatIndex.toFixed(1), supportingText: 'Calculated from temperature and humidity', status: heatIndex >= 40 ? 'poor' : heatIndex >= 32 ? 'moderate' : 'good', statusLabel: 'Live' },
        { ...current.weather.metrics[2], value: dewPoint.toFixed(1), supportingText: 'Calculated by backend feature engineering', statusLabel: 'Live' },
        { ...current.weather.metrics[3], value: condition, supportingText: `Wind ${windSpeed.toFixed(1)} m/s · Dir ${windDirection.toFixed(0)}°`, status, statusLabel: 'Live' },
        { ...current.weather.metrics[4], value: rainAlert ? '1' : '0', supportingText: rainAlert ? `Rainfall ${rainfall.toFixed(1)} mm` : 'No rain alert', status: rainAlert ? 'moderate' : 'good', statusLabel: rainAlert ? 'Active' : 'Clear' },
      ],
      forecast,
      status: { label: condition, description: `Humidity ${humidity.toFixed(0)}% · Wind ${windSpeed.toFixed(1)} m/s · Rainfall ${rainfall.toFixed(1)} mm`, status },
      alerts: { count: rainAlert ? 1 : 0, message: rainAlert ? 'Rain alert detected' : 'No active weather alerts', status: rainAlert ? 'moderate' : 'good' },
      details: {
        temperature,
        humidity,
        rainfall,
        windSpeed,
        windDirection,
      },
    },
    history: newHistory,
    lastUpdated: 'just now',
  };
}

function applyAir(current: EnvironmentalData, dashboard: DashboardResponse): EnvironmentalData {
  // The reading row uses the exact column names stored by airQualityModel:
  //   pm1, pm25, pm4, pm10, co2, nox, voc, co, o3, floor_level
  // The features row uses: air_health_score, aqi_category, aqi
  const r = dashboard.reading ?? {};
  const f = dashboard.features ?? {};

  // DB stores columns directly as pm1, pm25, pm4, pm10, co2, nox, voc, co, o3
  const particulate = (id: string, name: string, key: string) => {
    const value = n(r[key], 0); const status = airStatus(value, id);
    return { id, name, value, unit: 'µg/m³', status, statusLabel: status === 'good' ? 'Good' : status === 'moderate' ? 'Moderate' : 'High', trend: 'stable' as Trend };
  };
  const gas = (id: string, symbol: string, fullName: string, unit: string, key?: string) => {
    const value = n(r[key ?? id], 0); const status = airStatus(value, id);
    return { id, symbol, fullName, value, unit, status, statusLabel: status === 'good' ? 'Normal' : status === 'moderate' ? 'Elevated' : 'High' };
  };

  const score = n(f.air_health_score, current.air.score);
  const category = s(f.aqi_category, 'Live air data');
  const aqiValue = n(f.aqi, 0);
  const floorLevel = s(r.floor_level as string, '');
  const floorLabel = floorLevel ? ` (${floorLevel} floor)` : '';

  // Update rolling history for AQI
  const newHistory: SensorHistory = {
    ...current.history,
    aqi: pushHistory(current.history.aqi, aqiValue),
  };

  return {
    ...current,
    air: {
      ...current.air,
      score,
      healthDescription: `${category}${f.aqi != null ? ` · AQI ${aqiValue.toFixed(0)}${floorLabel}` : ''}`,
      particulates: [
        particulate('pm1',  'PM1',   'pm1'),
        particulate('pm25', 'PM2.5', 'pm25'),
        particulate('pm4',  'PM4',   'pm4'),
        particulate('pm10', 'PM10',  'pm10'),
      ],
      gases: [
        gas('co2', 'CO₂', 'Carbon Dioxide',             'ppm'),
        gas('co',  'CO',  'Carbon Monoxide',             'ppm'),
        gas('o3',  'O₃',  'Ozone',                      'ppb'),
        gas('nox', 'NOx', 'Nitrogen Oxides',             'ppb'),
        gas('voc', 'VOC', 'Volatile Organic Compounds',  'index'),
      ],
      // floors will be updated separately via applyAirFloors()
    },
    history: newHistory,
    lastUpdated: 'just now',
  };
}

/** Apply per-floor readings returned by /api/air/readings/floors */
function applyAirFloors(current: EnvironmentalData, floorRows: Record<string, unknown>[]): EnvironmentalData {
  const floors: FloorReading[] = floorRows.map((row) => ({
    floorLevel: s(row.floor_level as string, 'unknown'),
    pm1:  n(row.pm1, 0),
    pm25: n(row.pm25, 0),
    pm4:  n(row.pm4, 0),
    pm10: n(row.pm10, 0),
    co2:  n(row.co2, 0),
    nox:  n(row.nox, 0),
    voc:  n(row.voc, 0),
    co:   n(row.co, 0),
    o3:   n(row.o3, 0),
    timestamp: s(row.timestamp as string, ''),
  }));
  return { ...current, air: { ...current.air, floors } };
}

function applyNoise(current: EnvironmentalData, dashboard: DashboardResponse): EnvironmentalData {
  // DB columns from noise_readings: noise_level_db, device_id, location
  // DB columns from noise_features:  noise_category, noise_status, noise_health_score, noise_alerts
  const r = dashboard.reading ?? {};
  const f = dashboard.features ?? {};

  // Accept multiple naming variants from different serializers.
  const rawLevel =
    r.noise_level_db ??
    r.noiseLevelDb ??
    r.noiseLevel ??
    r.noiselevel;
  const level = n(rawLevel, current.noise.level);

  // Features row uses snake_case: noise_category, noise_status, noise_health_score, noise_alerts
  const category = s(f.noise_category as string, level < 60 ? 'Low' : level <= 85 ? 'Moderate' : 'High');
  const tier: 'low' | 'moderate' | 'high' = category.toLowerCase() === 'low' ? 'low' : category.toLowerCase() === 'moderate' ? 'moderate' : 'high';
  const noiseStatus = s(f.noise_status as string, tier === 'low' ? 'Quiet / Optimal' : tier === 'moderate' ? 'Noticeable / Acceptable' : 'Loud / Hazardous');
  const noiseScore = n(f.noise_health_score, current.noise.score);

  // noise_alerts is stored as a JSON array in the DB
  const rawAlerts = f.noise_alerts;
  let alerts: string[] = [];
  if (Array.isArray(rawAlerts)) {
    alerts = rawAlerts.map(String);
  } else if (typeof rawAlerts === 'string') {
    try {
      const parsed = JSON.parse(rawAlerts || '[]');
      if (Array.isArray(parsed)) alerts = parsed.map(String);
    } catch {
      alerts = [];
    }
  }

  // Update rolling history for noise
  const newHistory: SensorHistory = {
    ...current.history,
    noiseLevel: pushHistory(current.history.noiseLevel, level),
  };

  return {
    ...current,
    noise: {
      ...current.noise,
      level,
      category,
      categoryTier: tier,
      statusLabel: noiseStatus,
      statusDetail: `${category} noise environment · Device: ${s(r.device_id as string, 'ESP32')} · Location: ${s(r.location as string, 'Campus')}`,
      score: noiseScore,
      stats: [
        { label: 'Current Level', value: `${level.toFixed(1)} dB(A)` },
        { label: 'Category',      value: category },
        { label: 'Location',      value: s(r.location as string, 'Campus') },
        { label: 'Device',        value: s(r.device_id as string, 'ESP32') },
      ],
      alerts: alerts.length > 0
        ? alerts.map((a, i) => ({ id: String(i), title: a, detail: 'Live backend alert', ok: false }))
        : [{ id: 'clear', title: 'No Active Alerts', detail: 'Noise level within configured range', ok: true }],
    },
    history: newHistory,
    lastUpdated: 'just now',
  };
}

/** Re-compute composite score and system alert count after all three modules are applied */
function applyDerived(data: EnvironmentalData): EnvironmentalData {
  const weatherScore = data.weather.score;
  const airScore = data.air.score;
  const noiseScore = data.noise.score;
  // Average of whichever scores have received real data (non-zero)
  const scores = [weatherScore, airScore, noiseScore].filter(s => s > 0);
  const compositeScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const activeNoiseAlerts = data.noise.alerts.filter(a => !a.ok).length;
  const systemAlerts = data.weather.alerts.count + activeNoiseAlerts;

  return { ...data, compositeScore, systemAlerts };
}

async function fetchDashboard(path: string): Promise<DashboardResponse> {
  const response = await fetch(api(path));
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json() as Promise<DashboardResponse>;
}

export function useEnvironmentalData(): EnvironmentalData {
  const initial = useMemo(makeDefaultData, []);
  const [data, setData] = useState<EnvironmentalData>(initial);
  // Use a ref to persist history across renders without triggering re-fetch loops
  const historyRef = useRef<SensorHistory>(makeDefaultHistory());

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [wRes, aRes, nRes, floorRes] = await Promise.allSettled([
        fetchDashboard('/api/weather/dashboard'),
        fetchDashboard('/api/air/dashboard'),
        fetchDashboard('/api/noise/dashboard'),
        fetch(api('/api/air/readings/floors')).then(r => r.ok ? r.json() : []),
      ]);
      if (!active) return;
      setData((current) => {
        let next = { ...current, history: historyRef.current };
        if (wRes.status === 'fulfilled') next = applyWeather(next, wRes.value);
        if (aRes.status === 'fulfilled') next = applyAir(next, aRes.value);
        if (nRes.status === 'fulfilled') next = applyNoise(next, nRes.value);
        if (floorRes.status === 'fulfilled' && Array.isArray(floorRes.value) && floorRes.value.length > 0) {
          next = applyAirFloors(next, floorRes.value);
        }
        next = applyDerived(next);
        historyRef.current = next.history;
        return next;
      });
    };

    void load();
    const refreshTimer = window.setInterval(() => void load(), 3000);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  return data;
}
