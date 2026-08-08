import React, { useEffect, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Thermometer,
  Droplets,
  CloudSun,
  CloudRain,
  ShieldAlert,
  Volume2,
  CheckCircle2,
  Cpu,
  TriangleAlert,
  Clock,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

import { ScoreRing } from '../components/dashboard/ScoreRing';
import { LiveBadge } from '../components/dashboard/DashboardSection';
import { cn } from '../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/* EcoPulse Pro design tokens */
const EP_CARD =
  'rounded-[14px] border border-[#e8edf5] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.08)] dark:border-[var(--border)] dark:bg-[var(--surface)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]';
const EP_PAD = { padding: 20 } as const;
const PAGE_INSET = { padding: '32px 36px 48px' } as const;
const SECTION_GAP = 'gap-5';
const GRID_GAP = 'gap-4';

const FEATURES_PAGE_BG = {
  backgroundColor: 'var(--weather-page-bg-color)',
  backgroundImage: 'var(--weather-page-bg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
};

export interface WeatherFeatures {
  id?: string;
  weather_reading_id?: string;
  timestamp?: string;
  heat_index?: number | null;
  dew_point?: number | null;
  weather_status?: string;
  rain_alert?: boolean;
  created_at?: string;
}

export interface AirFeatures {
  id?: string;
  air_reading_id?: string;
  timestamp?: string;
  aqi?: number | null;
  aqi_category?: string | null;
  dominant_pollutant?: string | null;
  air_health_score?: number | null;
  air_alerts?: string[] | string | null;
  created_at?: string;
}

export interface NoiseFeatures {
  id?: string;
  noise_reading_id?: string;
  timestamp?: string;
  noise_status?: string | null;
  noise_category?: string | null;
  noise_alerts?: string[] | string | null;
  noise_health_score?: number | null;
  created_at?: string;
}

function parseAlerts(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [];
    }
  }
  return [];
}

export const EngineeredFeaturesPage: React.FC = () => {
  const [weatherFeat, setWeatherFeat] = useState<WeatherFeatures | null>(null);
  const [airFeat, setAirFeat] = useState<AirFeatures | null>(null);
  const [noiseFeat, setNoiseFeat] = useState<NoiseFeatures | null>(null);

  const [weatherHistory, setWeatherHistory] = useState<WeatherFeatures[]>([]);
  const [airHistory, setAirHistory] = useState<AirFeatures[]>([]);
  const [noiseHistory, setNoiseHistory] = useState<NoiseFeatures[]>([]);

  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('connecting…');

  const backendUrl = useMemo(() => {
    return (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:5000';
  }, []);

  // 1. Initial REST fetch for latest & history
  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      try {
        const [wRes, aRes, nRes, wHistRes, aHistRes, nHistRes] = await Promise.allSettled([
          fetch(`${backendUrl}/api/weather/features/latest`).then((r) => (r.ok ? r.json() : null)),
          fetch(`${backendUrl}/api/air/features/latest`).then((r) => (r.ok ? r.json() : null)),
          fetch(`${backendUrl}/api/noise/features/latest`).then((r) => (r.ok ? r.json() : null)),
          fetch(`${backendUrl}/api/weather/features/history?limit=15`).then((r) => (r.ok ? r.json() : null)),
          fetch(`${backendUrl}/api/air/features/history?limit=15`).then((r) => (r.ok ? r.json() : null)),
          fetch(`${backendUrl}/api/noise/features/history?limit=15`).then((r) => (r.ok ? r.json() : null)),
        ]);

        if (!isMounted) return;

        if (wRes.status === 'fulfilled' && wRes.value) setWeatherFeat(wRes.value);
        if (aRes.status === 'fulfilled' && aRes.value) setAirFeat(aRes.value);
        if (nRes.status === 'fulfilled' && nRes.value) setNoiseFeat(nRes.value);

        if (wHistRes.status === 'fulfilled' && wHistRes.value?.data) {
          setWeatherHistory(wHistRes.value.data.slice().reverse());
        }
        if (aHistRes.status === 'fulfilled' && aHistRes.value?.data) {
          setAirHistory(aHistRes.value.data.slice().reverse());
        }
        if (nHistRes.status === 'fulfilled' && nHistRes.value?.data) {
          setNoiseHistory(nHistRes.value.data.slice().reverse());
        }

        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('[EngineeredFeatures] REST fetch failed:', err);
      }
    };

    void fetchAll();
    const interval = setInterval(fetchAll, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [backendUrl]);

  // 2. Real-time Socket.IO listener
  useEffect(() => {
    const socket: Socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setIsSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    socket.on('weather:features', (data: WeatherFeatures) => {
      setWeatherFeat(data);
      setWeatherHistory((prev) => [...prev.slice(-14), data]);
      setLastUpdated(new Date().toLocaleTimeString());
    });

    socket.on('air:features', (data: AirFeatures) => {
      setAirFeat(data);
      setAirHistory((prev) => [...prev.slice(-14), data]);
      setLastUpdated(new Date().toLocaleTimeString());
    });

    socket.on('noise:features', (data: NoiseFeatures) => {
      setNoiseFeat(data);
      setNoiseHistory((prev) => [...prev.slice(-14), data]);
      setLastUpdated(new Date().toLocaleTimeString());
    });

    return () => {
      socket.disconnect();
    };
  }, [backendUrl]);

  // Derive composite scores & alert counts
  const airHealthScore = airFeat?.air_health_score != null ? Number(airFeat.air_health_score) : 85;
  const noiseHealthScore = noiseFeat?.noise_health_score != null ? Number(noiseFeat.noise_health_score) : 90;
  const compositeScore = Math.round((airHealthScore + noiseHealthScore) / 2);

  const airAlertsList = parseAlerts(airFeat?.air_alerts);
  const noiseAlertsList = parseAlerts(noiseFeat?.noise_alerts);
  const rainAlertActive = Boolean(weatherFeat?.rain_alert);

  const totalActiveAlerts =
    airAlertsList.length + noiseAlertsList.length + (rainAlertActive ? 1 : 0);

  // Chart configuration
  const chartLabels = (weatherHistory.length > 0 ? weatherHistory : Array(7).fill({})).map(
    (item: any, idx) =>
      item.timestamp
        ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : `T-${7 - idx}`
  );

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'AQI (Air Quality)',
        data: (airHistory.length > 0 ? airHistory : Array(7).fill({ aqi: 42 })).map(
          (d) => d.aqi ?? 42
        ),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        tension: 0.35,
        fill: true,
      },
      {
        label: 'Noise Health Score',
        data: (noiseHistory.length > 0 ? noiseHistory : Array(7).fill({ noise_health_score: 90 })).map(
          (d) => d.noise_health_score ?? 90
        ),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        tension: 0.35,
        fill: true,
      },
      {
        label: 'Heat Index (°C)',
        data: (weatherHistory.length > 0 ? weatherHistory : Array(7).fill({ heat_index: 29 })).map(
          (d) => d.heat_index ?? 29
        ),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          font: { family: 'Inter', size: 12 },
          boxWidth: 8,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'IBM Plex Mono', size: 11 }, color: '#93A4B5' },
      },
      y: {
        grid: { color: 'rgba(147,164,181,0.15)' },
        ticks: { font: { family: 'IBM Plex Mono', size: 11 }, color: '#93A4B5' },
      },
    },
  };

  return (
    <>
      {/* Soft campus frost background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-0"
        style={{
          left: 'var(--sidebar-w)',
          top: 'var(--topnav-h)',
          right: 0,
          bottom: 0,
          ...FEATURES_PAGE_BG,
        }}
      />

      <div className="relative z-10 h-full overflow-y-auto font-[family-name:var(--font-weather)] text-[var(--ink)] antialiased">
        <div className={cn('mx-auto flex max-w-[1440px] flex-col', SECTION_GAP)} style={PAGE_INSET}>
          
          {/* Header Title & Subtitle */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="m-0 text-[1.75rem] font-extrabold tracking-tight text-[#1e3a5f] dark:text-white lg:text-[1.85rem]">
                  Engineered Features
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Cpu className="h-3.5 w-3.5" /> Live Backend Pipeline
                </span>
              </div>
              <p
                className="mt-2 max-w-2xl text-[15px] italic leading-relaxed text-[var(--ink-soft)]"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                &quot;Real-time computed environmental indices, EPA air scores, Magnus dew points, and sound safety classifications derived from live sensor telemetry.&quot;
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-soft)]">
                <Clock className="h-3.5 w-3.5" />
                Updated {lastUpdated}
              </span>
              <LiveBadge />
            </div>
          </div>

          {/* Feature Engine Health Banner */}
          <article
            className={cn(EP_CARD, 'relative flex flex-col sm:flex-row items-center gap-6')}
            style={EP_PAD}
          >
            <div className="shrink-0">
              <ScoreRing
                score={compositeScore}
                size={100}
                strokeWidth={10}
                ringColor="var(--green)"
                trackColor="var(--green-soft)"
                ariaLabel={`Composite Engineered Score ${compositeScore}`}
              />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-[1.2rem] font-bold text-[var(--ink)]">Composite Environmental Health Index</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  <CheckCircle2 className="h-3 w-3" />
                  {isSocketConnected ? 'Socket.IO Stream Active' : 'Polling REST API'}
                </span>
              </div>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                Calculated synchronously across Weather, Air Quality, and Noise feature engines.
                {totalActiveAlerts > 0
                  ? ` Attention required: ${totalActiveAlerts} feature alert(s) detected across system nodes.`
                  : ' All engineered parameters are currently within normal environmental thresholds.'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 border-t sm:border-t-0 sm:border-l border-[var(--border)] pt-3 sm:pt-0 sm:pl-6">
              <div className="text-center">
                <span className="block text-2xl font-bold text-[#1e3a5f] dark:text-white">{totalActiveAlerts}</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">Active Alerts</span>
              </div>
            </div>
          </article>

          {/* Module 1: Weather Features */}
          <section className="min-w-0">
            <div className="mb-3.5 flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-amber-500" />
              <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--ink)]">
                Weather Engineered Features
              </h2>
            </div>
            <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4', GRID_GAP)}>
              
              {/* Heat Index */}
              <article className={cn(EP_CARD, 'flex flex-col')} style={EP_PAD}>
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                    <Thermometer className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                    Rothfusz Eq.
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">Heat Index</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-[2.2rem] font-bold leading-none text-[var(--ink)]">
                    {weatherFeat?.heat_index != null ? Number(weatherFeat.heat_index).toFixed(1) : '--'}
                  </span>
                  <span className="text-sm font-semibold text-[var(--ink-faint)]">°C</span>
                </div>
                <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
                  {weatherFeat?.heat_index != null && Number(weatherFeat.heat_index) >= 32
                    ? 'Caution: Elevated heat stress'
                    : 'Comfortable perceived temperature'}
                </p>
              </article>

              {/* Dew Point */}
              <article className={cn(EP_CARD, 'flex flex-col')} style={EP_PAD}>
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-teal-100 dark:bg-teal-950/80 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-700 dark:text-teal-300">
                    Magnus Formula
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">Dew Point</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-[2.2rem] font-bold leading-none text-[var(--ink)]">
                    {weatherFeat?.dew_point != null ? Number(weatherFeat.dew_point).toFixed(1) : '--'}
                  </span>
                  <span className="text-sm font-semibold text-[var(--ink-faint)]">°C</span>
                </div>
                <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
                  Atmospheric moisture saturation level
                </p>
              </article>

              {/* Weather Status */}
              <article className={cn(EP_CARD, 'flex flex-col')} style={EP_PAD}>
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                    <CloudSun className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300">
                    Rule Engine
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">Weather Status</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[1.8rem] font-bold leading-none text-[#1e3a5f] dark:text-white">
                    {weatherFeat?.weather_status || 'Clear'}
                  </span>
                </div>
                <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
                  Derived status from rainfall, humidity &amp; wind
                </p>
              </article>

              {/* Rain Alert */}
              <article className={cn(EP_CARD, 'flex flex-col')} style={EP_PAD}>
                <div className="flex items-center justify-between">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', rainAlertActive ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400')}>
                    <CloudRain className="h-5 w-5" />
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', rainAlertActive ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300')}>
                    {rainAlertActive ? 'Alert Triggered' : 'Normal'}
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">Rain Alert</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={cn('text-[1.8rem] font-bold leading-none', rainAlertActive ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
                    {rainAlertActive ? 'Active Alert' : 'Clear'}
                  </span>
                </div>
                <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
                  {rainAlertActive ? 'Precipitation > 5mm threshold exceeded' : 'Rainfall level below alert threshold'}
                </p>
              </article>

            </div>
          </section>

          {/* Module 2: Air Quality Features */}
          <section className="min-w-0">
            <div className="mb-3.5 flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-blue-500" />
              <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--ink)]">
                Air Quality Engineered Features
              </h2>
            </div>
            <div className={cn('grid grid-cols-1 lg:grid-cols-[1.8fr_1fr]', GRID_GAP)}>
              
              {/* Left Grid: AQI, AQI Category, Dominant Pollutant, Air Alerts */}
              <div className={cn('grid grid-cols-1 sm:grid-cols-3', GRID_GAP)}>
                {/* AQI */}
                <article className={cn(EP_CARD, 'flex flex-col')} style={EP_PAD}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">EPA Air Quality Index (AQI)</p>
                  <p className="mt-2 text-[2.5rem] font-bold leading-none text-[var(--ink)]">
                    {airFeat?.aqi != null ? Math.round(Number(airFeat.aqi)) : '--'}
                  </p>
                  <span className="mt-3 inline-flex w-fit rounded-md bg-blue-50 dark:bg-blue-950/60 px-2 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                    Linear EPA Breakpoint
                  </span>
                </article>

                {/* AQI Category */}
                <article className={cn(EP_CARD, 'flex flex-col')} style={EP_PAD}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">AQI Category</p>
                  <p className="mt-2 text-[1.4rem] font-bold leading-snug text-[#1e3a5f] dark:text-white">
                    {airFeat?.aqi_category || 'Good'}
                  </p>
                  <span className="mt-auto inline-flex w-fit rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Health Classification
                  </span>
                </article>

                {/* Dominant Pollutant */}
                <article className={cn(EP_CARD, 'flex flex-col')} style={EP_PAD}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">Dominant Pollutant</p>
                  <p className="mt-2 text-[1.8rem] font-bold leading-none text-emerald-600 dark:text-emerald-400">
                    {airFeat?.dominant_pollutant || 'PM2.5'}
                  </p>
                  <p className="mt-auto text-[11px] text-[var(--ink-soft)]">Max Sub-Index Pollutant</p>
                </article>

                {/* Air Alerts Full Width */}
                <article className={cn(EP_CARD, 'sm:col-span-3 flex flex-col')} style={EP_PAD}>
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-3">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--ink)]">Engineered Air Alerts</span>
                    <span className="text-[11px] font-mono text-[var(--ink-faint)]">{airAlertsList.length} Active</span>
                  </div>
                  {airAlertsList.length > 0 ? (
                    <ul className="space-y-2">
                      {airAlertsList.map((alert, i) => (
                        <li key={i} className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-2.5 text-[12.5px] font-semibold text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/40">
                          <TriangleAlert className="h-4 w-4 shrink-0 text-red-500" />
                          {alert}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-3 text-[12.5px] font-medium text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      No active air quality warnings detected across pollutant sub-indices.
                    </div>
                  )}
                </article>
              </div>

              {/* Right: Air Health Score Ring */}
              <article className={cn(EP_CARD, 'flex flex-col items-center text-center justify-center')} style={EP_PAD}>
                <p className="w-full text-left text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
                  Air Health Score
                </p>
                <div className="my-4">
                  <ScoreRing
                    score={airHealthScore}
                    size={140}
                    strokeWidth={11}
                    ringColor="var(--green)"
                    trackColor="var(--surface-alt)"
                    ariaLabel={`Air Health Score ${airHealthScore}`}
                  />
                </div>
                <p className="text-[1.2rem] font-bold text-[#1e3a5f] dark:text-white">
                  {airFeat?.aqi_category || 'Good Quality'}
                </p>
                <p className="mt-1 max-w-[220px] text-[12px] text-[var(--ink-soft)]">
                  Composite score formula: 100 - clamp(AQI / 5, 0, 100)
                </p>
              </article>

            </div>
          </section>

          {/* Module 3: Noise Features */}
          <section className="min-w-0">
            <div className="mb-3.5 flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-emerald-500" />
              <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--ink)]">
                Noise Engineered Features
              </h2>
            </div>
            <div className={cn('grid grid-cols-1 lg:grid-cols-[1.8fr_1fr]', GRID_GAP)}>
              
              {/* Left Grid: Noise Status, Noise Category, Noise Alerts */}
              <div className={cn('grid grid-cols-1 sm:grid-cols-2', GRID_GAP)}>
                
                {/* Noise Status */}
                <article className={cn(EP_CARD, 'flex flex-col')} style={EP_PAD}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">Noise Status</span>
                    <Volume2 className="h-4 w-4 text-[var(--ink-faint)]" />
                  </div>
                  <p className="mt-2 text-[1.45rem] font-bold text-[#1e3a5f] dark:text-white">
                    {noiseFeat?.noise_status || 'Quiet / Optimal'}
                  </p>
                  <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
                    Calculated condition status from sensor decibels
                  </p>
                </article>

                {/* Noise Category */}
                <article className={cn(EP_CARD, 'flex flex-col')} style={EP_PAD}>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">Noise Category</span>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[1.8rem] font-bold text-emerald-600 dark:text-emerald-400">
                      {noiseFeat?.noise_category || 'Low'}
                    </span>
                    <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      &lt; 60 dB(A)
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
                    Institutional acoustic comfort classification
                  </p>
                </article>

                {/* Noise Alerts */}
                <article className={cn(EP_CARD, 'sm:col-span-2 flex flex-col')} style={EP_PAD}>
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-3">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--ink)]">Engineered Noise Alerts</span>
                    <span className="text-[11px] font-mono text-[var(--ink-faint)]">{noiseAlertsList.length} Active</span>
                  </div>
                  {noiseAlertsList.length > 0 ? (
                    <ul className="space-y-2">
                      {noiseAlertsList.map((alert, i) => (
                        <li key={i} className="flex items-center gap-2 rounded-lg bg-orange-50 dark:bg-orange-950/40 p-2.5 text-[12.5px] font-semibold text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-900/40">
                          <ShieldAlert className="h-4 w-4 shrink-0 text-orange-500" />
                          {alert}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-3 text-[12.5px] font-medium text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Acoustic level within comfortable standards. No hearing protection alerts.
                    </div>
                  )}
                </article>
              </div>

              {/* Right: Noise Health Score */}
              <article className={cn(EP_CARD, 'flex flex-col items-center text-center justify-center')} style={EP_PAD}>
                <p className="w-full text-left text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
                  Noise Health Score
                </p>
                <div className="my-4">
                  <ScoreRing
                    score={noiseHealthScore}
                    size={140}
                    strokeWidth={11}
                    ringColor="var(--green)"
                    trackColor="var(--surface-alt)"
                    ariaLabel={`Noise Health Score ${noiseHealthScore}`}
                  />
                </div>
                <p className="text-[1.2rem] font-bold text-[#1e3a5f] dark:text-white">
                  {noiseFeat?.noise_category || 'Low'} Noise Tier
                </p>
                <p className="mt-1 max-w-[220px] text-[12px] text-[var(--ink-soft)]">
                  Linear scale formula: 100 for &le; 40dB, 0 for &ge; 120dB
                </p>
              </article>

            </div>
          </section>

          {/* Feature History Trends Chart */}
          <section className={cn(EP_CARD, 'flex flex-col')} style={EP_PAD}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--ink)]">Engineered Features Historical Trends</h3>
                <p className="text-[12px] text-[var(--ink-faint)]">Real-time telemetry feature progression over time</p>
              </div>
              <span className="rounded-md bg-[var(--surface-alt)] px-3 py-1 text-[11px] font-mono text-[var(--ink-soft)]">
                History Buffer ({chartLabels.length} points)
              </span>
            </div>
            <div className="h-[280px] w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          </section>

        </div>
      </div>
    </>
  );
};

export default EngineeredFeaturesPage;
