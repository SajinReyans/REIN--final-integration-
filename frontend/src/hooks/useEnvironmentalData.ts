import { useEffect, useMemo, useState } from 'react';
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
  };
  air: {
    quote: string[];
    score: number;
    aboutDescription: string;
    healthDescription: string;
    particulates: ParticulateReading[];
    gases: GasReading[];
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
}

type DashboardResponse = { reading: Record<string, unknown> | null; features: Record<string, unknown> | null; prediction: Record<string, unknown> | null };

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
        { id: 'temp', name: 'Temperature', value: 29.4, unit: '°C', supportingText: 'ESP32 weather sensor', icon: Thermometer, status: 'good', statusLabel: 'Live', iconTint: 'blue' },
        { id: 'heat', name: 'Heat Index', value: 31.2, unit: '°C', supportingText: 'Calculated by backend', icon: Sun, status: 'moderate', statusLabel: 'Calculated', iconTint: 'orange' },
        { id: 'dew', name: 'Dew Point', value: 18.5, unit: '°C', supportingText: 'Calculated by backend', icon: Droplets, status: 'good', statusLabel: 'Calculated', iconTint: 'cyan' },
        { id: 'sky', name: 'Weather Status', value: 'Waiting for data', unit: '', supportingText: 'MQTT connection pending', icon: CloudSun, status: 'good', statusLabel: 'Standby', iconTint: 'blue' },
        { id: 'alerts', name: 'Rain Alert', value: '0', unit: 'Active', supportingText: 'No active alert', icon: TriangleAlert, status: 'good', statusLabel: 'Clear', iconTint: 'amber' },
      ],
      forecast,
      status: { label: 'Waiting for data', description: 'Start the backend and ESP32 MQTT publisher.', status: 'good' },
      alerts: { count: 0, message: 'No active alert', status: 'good' },
    },
    air: {
      quote: ['Clean air supports a healthier campus.', 'Live values will appear when the air sensor publishes telemetry.'],
      score: 88,
      aboutDescription: 'Current particulate and gas measurements received from ESP32 nodes.',
      healthDescription: 'Waiting for live air-quality data.',
      particulates: [
        { id: 'pm1', name: 'PM1', value: 12, unit: 'µg/m³', status: 'good', statusLabel: 'Standby', trend: 'stable' },
        { id: 'pm25', name: 'PM2.5', value: 18, unit: 'µg/m³', status: 'good', statusLabel: 'Standby', trend: 'stable' },
        { id: 'pm4', name: 'PM4', value: 24, unit: 'µg/m³', status: 'good', statusLabel: 'Standby', trend: 'stable' },
        { id: 'pm10', name: 'PM10', value: 32, unit: 'µg/m³', status: 'good', statusLabel: 'Standby', trend: 'stable' },
      ],
      gases: [
        { id: 'co2', symbol: 'CO₂', fullName: 'Carbon Dioxide', value: 410, unit: 'ppm', status: 'good', statusLabel: 'Standby' },
        { id: 'co', symbol: 'CO', fullName: 'Carbon Monoxide', value: 0.5, unit: 'ppm', status: 'good', statusLabel: 'Standby' },
        { id: 'o3', symbol: 'O₃', fullName: 'Ozone', value: 42, unit: 'ppb', status: 'good', statusLabel: 'Standby' },
        { id: 'nox', symbol: 'NOx', fullName: 'Nitrogen Oxides', value: 18, unit: 'ppb', status: 'good', statusLabel: 'Standby' },
        { id: 'voc', symbol: 'VOC', fullName: 'Volatile Organic Compounds', value: 3, unit: 'index', status: 'good', statusLabel: 'Standby' },
      ],
    },
    noise: {
      quote: 'A campus at its best is heard as gently as it is seen.',
      level: 48,
      unit: 'dB(A)',
      category: 'Waiting for data',
      categoryTier: 'low',
      statusLabel: 'Waiting for ESP32 noise data',
      statusDetail: 'Live acoustic measurements will appear automatically.',
      score: 88,
      scoreSubtitle: 'Backend-computed noise health score',
      aboutDescription: 'Continuous acoustic monitoring through the REIN backend.',
      stats: [{ label: 'Current Level', value: '48 dB(A)' }, { label: 'Data Source', value: 'ESP32' }, { label: 'Transport', value: 'MQTT' }],
      alerts: [{ id: 'a1', title: 'No Active Alerts', detail: 'Waiting for live sensor data', ok: true }],
    },
    lastUpdated: 'waiting for backend',
  };
}

function applyWeather(current: EnvironmentalData, dashboard: DashboardResponse): EnvironmentalData {
  const r = dashboard.reading ?? {};
  const f = dashboard.features ?? {};
  const temperature = n(r.temperature, n(current.weather.metrics[0].value, 29.4));
  const humidity = n(r.humidity, 0);
  const rainfall = n(r.rainfall, 0);
  const windSpeed = n(r.wind_speed, 0);
  const heatIndex = n(f.heat_index, temperature);
  const dewPoint = n(f.dew_point, temperature);
  const condition = s(f.weather_status, rainfall > 0 ? 'Rainy' : 'Clear');
  const rainAlert = Boolean(f.rain_alert);
  const forecast = buildSevenDayForecast({ tempC: temperature, heatIndexC: heatIndex, dewPointC: dewPoint, condition, alertActive: rainAlert, recentDailyHighsC: [temperature] });
  const status = weatherStatus(condition);
  return {
    ...current,
    weather: {
      ...current.weather,
      summary: `${condition} · ${temperature.toFixed(1)}°C · Humidity ${humidity.toFixed(0)}%`,
      condition,
      metrics: [
        { ...current.weather.metrics[0], value: temperature.toFixed(1), supportingText: `Humidity ${humidity.toFixed(0)}%`, status },
        { ...current.weather.metrics[1], value: heatIndex.toFixed(1), supportingText: 'Calculated from temperature and humidity', status: heatIndex >= 40 ? 'poor' : heatIndex >= 32 ? 'moderate' : 'good' },
        { ...current.weather.metrics[2], value: dewPoint.toFixed(1), supportingText: 'Calculated by backend feature engineering' },
        { ...current.weather.metrics[3], value: condition, supportingText: `Wind ${windSpeed.toFixed(1)} m/s`, status },
        { ...current.weather.metrics[4], value: rainAlert ? '1' : '0', supportingText: rainAlert ? `Rainfall ${rainfall.toFixed(1)} mm` : 'No rain alert', status: rainAlert ? 'moderate' : 'good', statusLabel: rainAlert ? 'Active' : 'Clear' },
      ],
      forecast,
      status: { label: condition, description: `Humidity ${humidity.toFixed(0)}% · Wind ${windSpeed.toFixed(1)} m/s · Rainfall ${rainfall.toFixed(1)} mm`, status },
      alerts: { count: rainAlert ? 1 : 0, message: rainAlert ? 'Rain alert detected' : 'No active weather alerts', status: rainAlert ? 'moderate' : 'good' },
    },
    lastUpdated: 'just now',
  };
}

function applyAir(current: EnvironmentalData, dashboard: DashboardResponse): EnvironmentalData {
  const r = dashboard.reading ?? {};
  const f = dashboard.features ?? {};
  const particulate = (id: string, name: string, key: string) => {
    const value = n(r[key], 0); const status = airStatus(value, id);
    return { id, name, value, unit: 'µg/m³', status, statusLabel: status === 'good' ? 'Good' : status === 'moderate' ? 'Moderate' : 'High', trend: 'stable' as Trend };
  };
  const gas = (id: string, symbol: string, fullName: string, unit: string) => {
    const value = n(r[id], 0); const status = airStatus(value, id);
    return { id, symbol, fullName, value, unit, status, statusLabel: status === 'good' ? 'Normal' : status === 'moderate' ? 'Elevated' : 'High' };
  };
  const score = n(f.air_health_score, current.air.score);
  const category = s(f.aqi_category, 'Live air data');
  return { ...current, air: { ...current.air, score, healthDescription: `${category}${f.aqi != null ? ` · AQI ${n(f.aqi, 0).toFixed(0)}` : ''}`, particulates: [particulate('pm1','PM1','pm1'), particulate('pm25','PM2.5','pm25'), particulate('pm4','PM4','pm4'), particulate('pm10','PM10','pm10')], gases: [gas('co2','CO₂','Carbon Dioxide','ppm'), gas('co','CO','Carbon Monoxide','ppm'), gas('o3','O₃','Ozone','ppb'), gas('nox','NOx','Nitrogen Oxides','ppb'), gas('voc','VOC','Volatile Organic Compounds','index')] }, lastUpdated: 'just now' };
}

function applyNoise(current: EnvironmentalData, dashboard: DashboardResponse): EnvironmentalData {
  const r = dashboard.reading ?? {}; const f = dashboard.features ?? {};
  const level = n(r.noise_level_db, current.noise.level);
  const category = s(f.noise_category, level < 55 ? 'Quiet' : level < 75 ? 'Moderate' : 'High');
  const tier: 'low' | 'moderate' | 'high' = level < 55 ? 'low' : level < 75 ? 'moderate' : 'high';
  const alerts = Array.isArray(f.noise_alerts) ? f.noise_alerts : [];
  return { ...current, noise: { ...current.noise, level, category, categoryTier: tier, statusLabel: s(f.noise_status, `${category} environment`), score: n(f.noise_health_score, current.noise.score), stats: [{ label: 'Current Level', value: `${level.toFixed(1)} dB(A)` }, { label: 'Location', value: s(r.location, 'Campus') }, { label: 'Device', value: s(r.device_id, 'ESP32') }], alerts: alerts.length ? alerts.map((a, i) => ({ id: String(i), title: String(a), detail: 'Live backend alert', ok: false })) : [{ id: 'clear', title: 'No Active Alerts', detail: 'Noise level is within the configured range', ok: true }] }, lastUpdated: 'just now' };
}

async function fetchDashboard(path: string): Promise<DashboardResponse> {
  const response = await fetch(api(path));
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json() as Promise<DashboardResponse>;
}

export function useEnvironmentalData(): EnvironmentalData {
  const initial = useMemo(makeDefaultData, []);
  const [data, setData] = useState<EnvironmentalData>(initial);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const results = await Promise.allSettled([
        fetchDashboard('/api/weather/dashboard'),
        fetchDashboard('/api/air/dashboard'),
        fetchDashboard('/api/noise/dashboard'),
      ]);
      if (!active) return;
      setData((current) => {
        let next = current;
        if (results[0].status === 'fulfilled') next = applyWeather(next, results[0].value);
        if (results[1].status === 'fulfilled') next = applyAir(next, results[1].value);
        if (results[2].status === 'fulfilled') next = applyNoise(next, results[2].value);
        return next;
      });
    };

    void load();
    // Refresh all three dashboard feeds automatically. This keeps the UI live
    // without requiring an extra browser dependency; the backend Socket.IO
    // broadcasts remain available for future direct event integration.
    const refreshTimer = window.setInterval(() => void load(), 3000);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  return data;
}
